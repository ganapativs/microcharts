// PercentileLadder geometry — pure, React-free. What does the
// tail look like, not just the median? Ticks at chosen percentiles on a
// zero-anchored track, graduated so the tail reads strongest (taller + accent).
// Tick DISTANCES carry the story, so the origin is never cropped; a log
// transform (long latency tails) is never silent — a `log` tag renders in a
// reserved left gutter so it never collides with a mark. Coords 2-dp.
import { quantiles } from "../../core/quantile.js";
import { clamp, extent, scaleLinear } from "../../core/scale.js";
import { isFiniteValue, round2, type Value } from "../../core/types.js";
import { textGutter } from "../../core/labels.js";

interface LadderTick {
  p: number;
  value: number;
  x: number;
  /** 0..k-1, tail highest — drives graduated emphasis (height + color). */
  emphasis: number;
  /** Half-height of this tick around the track (taller = more emphasis). */
  half: number;
}

export interface PercentileLadderGeometry {
  track: { x0: number; x1: number; y: number };
  ticks: LadderTick[];
  /** last tick value / first tick value, 2-dp; 0 when the first is 0. */
  ratio: number;
  /** Log scale actually applied (falls back to linear on any value ≤ 0). */
  log: boolean;
  /** Placement of the in-chart `log` tag (left gutter), or null. */
  logTag: { x: number; y: number } | null;
  /** All tick values coincide → render one tick. */
  collapsed: boolean;
  labelY: number;
}

const LADDER_MAX_PS = 4;

export function percentileLadderGeometry(opts: {
  width: number;
  height: number;
  data: readonly Value[];
  ps?: readonly number[] | undefined;
  scale?: "linear" | "log" | undefined;
  domain?: readonly [number, number] | undefined;
  /** Label font (viewBox units) — sizes the reserved `log`-tag gutter. */
  font?: number;
}): PercentileLadderGeometry | null {
  const { width, height } = opts;
  const pad = 3;
  const font = opts.font ?? 6;

  const finite = opts.data.filter(isFiniteValue);
  if (finite.length === 0) return null;

  const psRaw = (opts.ps ?? [50, 90, 99]).filter((p) => Number.isFinite(p));
  const ps = [...new Set(psRaw)].sort((a, b) => a - b).slice(0, LADDER_MAX_PS);
  if (ps.length === 0) return null;

  const vals = quantiles(
    finite,
    ps.map((p) => p / 100),
  )!;
  const dataMax = Math.max(...vals, 0);
  const dataMin = Math.min(...vals);
  const collapsed = dataMax === dataMin;

  // log only when every sample value is > 0 (a single ≤ 0 makes log a lie)
  const log = opts.scale === "log" && finite.every((v) => v > 0) && dataMax > 0;
  // left gutter for the "log" tag, sized to the tag width ("log" ≈ 3 ch) so it
  // never collides with the p50 tick/label at any font size
  const lead = log ? textGutter(3, font, 6) : 0;

  const y = round2(height * 0.35); // track sits upper — labels get room below
  const x0 = pad + lead;

  let x: (v: number) => number;
  if (log) {
    const lo = Math.min(...vals);
    const s = scaleLinear([Math.log(lo), Math.log(dataMax)], [x0, width - pad]);
    x = (v) => round2(clamp(s(Math.log(Math.max(v, lo))), x0, width - pad));
  } else {
    const dm =
      opts.domain && opts.domain.every((d) => Number.isFinite(d))
        ? opts.domain
        : ([0, dataMax || (extent(finite)?.[1] ?? 1)] as const);
    const domain: readonly [number, number] = dm[0] === dm[1] ? [dm[0], dm[1] + 1] : dm;
    const s = scaleLinear(domain, [x0, width - pad]);
    x = (v) => round2(clamp(s(v), x0, width - pad));
  }

  const k = ps.length;
  const maxHalf = round2(Math.min(3, height * 0.28));
  const ticks: LadderTick[] = ps.map((p, i) => ({
    p,
    value: round2(vals[i]!),
    x: x(vals[i]!),
    emphasis: k === 1 ? 0 : i,
    half: round2(maxHalf * (k === 1 ? 1 : 0.6 + 0.4 * (i / (k - 1)))),
  }));

  const first = vals[0]!;
  const quotient = first === 0 ? 0 : vals[k - 1]! / first;
  // round2 multiplies by 100 first, so a finite-but-huge quotient (denormal
  // inputs → e.g. 1.8e306) overflows to Infinity — guard the ROUNDED result
  const rounded = round2(quotient);
  const ratio = Number.isFinite(rounded) ? rounded : 0;

  return {
    track: { x0: round2(x0), x1: round2(width - pad), y },
    ticks,
    ratio,
    log,
    logTag: log ? { x: round2(pad - 2), y } : null,
    collapsed,
    labelY: round2(height - 0.5),
  };
}
