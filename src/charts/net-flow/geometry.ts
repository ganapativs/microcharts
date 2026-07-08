// NetFlow geometry — pure, React-free (plan/23 #6). In vs out, and where that
// leaves us net. Inflow area above a zero baseline, outflow mirrored below on
// ONE shared magnitude scale (never independently scaled to balance the
// picture), with the net line (in − out) restoring the precise decision value.
// Flows are magnitudes: a negative input is invalid and coerced to 0. Coords
// 2-dp, integer viewBox.
import { linePath } from "../../core/path.js";
import { clamp, scaleLinear } from "../../core/scale.js";
import { isFiniteValue, round2, type XY } from "../../core/types.js";

// A zero-anchored area, linear only (importing core/areaPath would drag in the
// smooth + step curve builders this chart never uses — ~0.5 kB). Baseline under
// the first point → across the tops → baseline under the last → close.
function zeroArea(pts: XY[], baselineY: number): string {
  if (pts.length === 0) return "";
  const tops = pts.map((p) => `${p[0]} ${p[1]}`).join(" L");
  return `M${pts[0]![0]} ${baselineY} L${tops} L${pts[pts.length - 1]![0]} ${baselineY} Z`;
}

export interface NetFlowPeriod {
  in: number;
  out: number;
}

export type NetFlowMode = "area" | "bars";

interface FlowBar {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface FlowPoint {
  x: number;
  in: number;
  out: number;
  net: number;
  /** viewBox y of the inflow top, the net line, and the outflow bottom. */
  inTopY: number;
  netY: number;
  outBotY: number;
}

export interface NetFlowGeometry {
  zeroY: number;
  inArea: { d: string };
  outArea: { d: string };
  netLine: { d: string };
  /** Per-period positions (x in the active mode) — overlays + nearest-x. */
  points: FlowPoint[];
  /** mode="bars" (also forced for a single period). */
  inBars: FlowBar[];
  outBars: FlowBar[];
  mode: NetFlowMode;
  last: { x: number; y: number; net: number; in: number; out: number } | null;
  /** in > out count (for the summary). */
  netPositive: number;
  n: number;
  /** All periods zero → baseline only. */
  degenerate: boolean;
  labelX: number;
  labelY: number;
  totalWidth: number;
}

const mag = (v: number): number => (isFiniteValue(v) && v > 0 ? v : 0);

export function netFlowGeometry(opts: {
  width: number;
  height: number;
  data: readonly NetFlowPeriod[];
  mode?: NetFlowMode | undefined;
  domain?: readonly [number, number] | undefined;
  pad?: number | undefined;
  gutterCh?: number | undefined;
  fontSize?: number | undefined;
}): NetFlowGeometry | null {
  const { width, height, data } = opts;
  const n = data.length;
  if (n === 0) return null;

  const pad = opts.pad ?? 2;
  const gutterCh = opts.gutterCh ?? 0;
  const fontSize = opts.fontSize ?? 0;
  const gutter = gutterCh > 0 ? Math.ceil(gutterCh * fontSize * 0.72) + 4 : 0;
  // an area through a single point is a lie about continuity — force bars
  const mode: NetFlowMode = n === 1 ? "bars" : (opts.mode ?? "area");

  const ins = data.map((d) => mag(d.in));
  const outs = data.map((d) => mag(d.out));
  const nets = ins.map((v, i) => v - outs[i]!);

  const maxMag =
    opts.domain && Number.isFinite(opts.domain[1]) && opts.domain[1] > 0
      ? opts.domain[1]
      : Math.max(0, ...ins, ...outs);
  const degenerate = maxMag === 0;

  const plotL = pad;
  const plotR = width - pad;
  const zeroY = round2(height / 2);
  const half = height / 2 - pad;
  const scale = scaleLinear([0, maxMag || 1], [0, half]);
  const up = (v: number) => round2(clamp(zeroY - scale(v), pad, height - pad));

  // area/line points span the plot edge-to-edge (line-chart geometry);
  // bars sit centered in per-period slots
  const lineX = (i: number) =>
    n === 1 ? (plotL + plotR) / 2 : plotL + ((plotR - plotL) * i) / (n - 1);
  const slotW = (plotR - plotL) / n;
  const barW = round2(Math.max(0.5, slotW * 0.66));
  const barCenter = (i: number) => plotL + slotW * (i + 0.5);

  const inPts: XY[] = ins.map((v, i) => [round2(lineX(i)), up(v)]);
  const outPts: XY[] = outs.map((v, i) => [
    round2(lineX(i)),
    round2(clamp(zeroY + scale(v), pad, height - pad)),
  ]);
  const netPts: XY[] = nets.map((v, i) => [round2(lineX(i)), up(v)]);

  const inBars: FlowBar[] = ins.map((v, i) => {
    const h = round2(scale(v));
    return { x: round2(barCenter(i) - barW / 2), y: round2(zeroY - h), width: barW, height: h };
  });
  const outBars: FlowBar[] = outs.map((v, i) => ({
    x: round2(barCenter(i) - barW / 2),
    y: zeroY,
    width: barW,
    height: round2(scale(v)),
  }));

  const down = (v: number) => round2(clamp(zeroY + scale(v), pad, height - pad));
  const points: FlowPoint[] = data.map((_, i) => ({
    x: round2(mode === "bars" ? barCenter(i) : lineX(i)),
    in: ins[i]!,
    out: outs[i]!,
    net: round2(nets[i]!),
    inTopY: up(ins[i]!),
    netY: up(nets[i]!),
    outBotY: down(outs[i]!),
  }));

  let netPositive = 0;
  for (let i = 0; i < n; i++) if (ins[i]! > outs[i]!) netPositive++;

  const lastNet = nets[n - 1]!;
  const last = degenerate
    ? {
        x: round2(mode === "bars" ? barCenter(n - 1) : lineX(n - 1)),
        y: zeroY,
        net: 0,
        in: ins[n - 1]!,
        out: outs[n - 1]!,
      }
    : {
        x: round2(mode === "bars" ? barCenter(n - 1) : lineX(n - 1)),
        y: up(lastNet),
        net: round2(lastNet),
        in: ins[n - 1]!,
        out: outs[n - 1]!,
      };

  return {
    zeroY,
    inArea: { d: degenerate ? "" : zeroArea(inPts, zeroY) },
    outArea: { d: degenerate ? "" : zeroArea(outPts, zeroY) },
    netLine: { d: degenerate ? "" : linePath(netPts) },
    points,
    inBars,
    outBars,
    mode,
    last,
    netPositive,
    n,
    degenerate,
    labelX: round2(width + 3),
    labelY: zeroY,
    totalWidth: width + gutter,
  };
}
