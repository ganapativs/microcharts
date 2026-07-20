// RetentionCurve geometry — pure, React-free. Do they stay, and
// does the curve plateau? A step line (cohort periods are discrete) on a
// domain LOCKED to [0,1] — the full range is the honest frame for a share;
// truncating the floor manufactures drama. Non-monotone bumps (resurrection)
// render as-is, never sorted or smoothed away. Coords 2-dp, integer viewBox.
import { smoothPath, stepPath } from "../../core/path.js";
import { clamp, scaleLinear } from "../../core/scale.js";
import { isFiniteValue, round2, type XY } from "../../core/types.js";

export type RetentionCurveType = "step" | "smooth";

interface RetentionPoint {
  /** Original period index (0 = cohort start). */
  period: number;
  x: number;
  y: number;
  value: number;
  /** Benchmark value + its y at this period, if a benchmark covers it. */
  bench: number | null;
  benchY: number | null;
}

export interface RetentionGeometry {
  line: { d: string };
  ghost: { d: string } | null;
  /** Per-period positions — overlays + nearest-x. */
  points: RetentionPoint[];
  last: { x: number; y: number; value: number };
  /** Present only when the documented plateau criterion holds. */
  plateau: { y: number; value: number; from: number; fromX: number } | null;
  labelX: number;
  labelY: number;
  totalWidth: number;
  /** Top edge of the plot box — full retention on the locked frame. */
  y0: number;
  /** Bottom edge of the plot box — zero retention. Also the inline seat's floor. */
  y1: number;
}

// share input may arrive as 0–1 or 0–100; a max over 1.001 means percent input
function normalize(data: readonly number[]): number[] {
  const finite = data.filter(isFiniteValue);
  const max = finite.length ? Math.max(...finite) : 0;
  const scale = max > 1.001 ? 1 / 100 : 1;
  return data.map((v) => (isFiniteValue(v) ? v * scale : Number.NaN));
}

export function retentionGeometry(opts: {
  width: number;
  height: number;
  data: readonly number[];
  benchmark?: readonly number[] | undefined;
  curve?: RetentionCurveType | undefined;
  plateau?: boolean | undefined;
  domain?: readonly [number, number] | undefined;
  pad?: number | undefined;
  gutterCh?: number | undefined;
  fontSize?: number | undefined;
}): RetentionGeometry | null {
  const { width, height, data } = opts;
  const values = normalize(data);
  const finiteCount = values.filter(isFiniteValue).length;
  if (finiteCount === 0) return null;

  const pad = opts.pad ?? 2;
  const gutterCh = opts.gutterCh ?? 0;
  const fontSize = opts.fontSize ?? 0;
  const gutter = gutterCh > 0 ? Math.ceil(gutterCh * fontSize * 0.72) + 4 : 0;
  const n = values.length;

  const bench = opts.benchmark ? normalize(opts.benchmark) : null;
  // x spans the LONGER of data / benchmark so both share one period scale
  const span = Math.max(n, bench?.length ?? 0);
  const domain: readonly [number, number] =
    opts.domain && opts.domain.every((d) => Number.isFinite(d)) ? opts.domain : [0, 1];

  const xScale = scaleLinear([0, Math.max(1, span - 1)], [pad, width - pad]);
  const yScale = scaleLinear(domain, [height - pad, pad]);
  const x = (i: number) => round2(xScale(i));
  const y = (v: number) => round2(clamp(yScale(v), pad, height - pad));

  const toPts = (arr: number[]): (XY | null)[] =>
    arr.map((v, i) => (isFiniteValue(v) ? [x(i), y(v)] : null));
  const build = opts.curve === "smooth" ? smoothPath : stepPath;

  const linePts = toPts(values);
  const ghostPts = bench ? toPts(bench) : null;

  const points: RetentionPoint[] = [];
  values.forEach((v, i) => {
    if (!isFiniteValue(v)) return;
    const b = bench && isFiniteValue(bench[i]) ? bench[i]! : null;
    points.push({
      period: i,
      x: x(i),
      y: y(v),
      value: round2(v),
      bench: b === null ? null : round2(b),
      benchY: b === null ? null : y(b),
    });
  });

  // last finite retention (endpoint)
  let lastIdx = -1;
  for (let i = 0; i < n; i++) if (isFiniteValue(values[i])) lastIdx = i;
  const last = {
    x: x(lastIdx),
    y: y(values[lastIdx]!),
    value: round2(values[lastIdx]!),
  };

  // plateau: mean |Δ| over the last k = max(3, ⌈n/3⌉) periods < 0.005
  let plateau: RetentionGeometry["plateau"] = null;
  if (opts.plateau !== false) {
    const finite = values.filter(isFiniteValue);
    const k = Math.max(3, Math.ceil(finite.length / 3));
    if (finite.length > k) {
      const windowVals = finite.slice(finite.length - k);
      let deltaSum = 0;
      for (let i = 1; i < windowVals.length; i++)
        deltaSum += Math.abs(windowVals[i]! - windowVals[i - 1]!);
      const meanDelta = deltaSum / (windowVals.length - 1);
      if (meanDelta < 0.005) {
        const level = windowVals.reduce((s, v) => s + v, 0) / windowVals.length;
        const from = finite.length - k;
        plateau = { y: y(level), value: round2(level), from, fromX: x(from) };
      }
    }
  }

  return {
    line: { d: build(linePts) },
    ghost: ghostPts ? { d: build(ghostPts) } : null,
    points,
    last,
    plateau,
    labelX: round2(width + 3),
    // `dominant-baseline: central` straddles y by half a font EACH way, so the
    // clamp is symmetric. Below `height < fontSize` no clamp exists and the
    // caller drops the label rather than painting it past the box.
    labelY: fontSize > 0 ? round2(clamp(last.y, fontSize * 0.5, height - fontSize * 0.5)) : last.y,
    totalWidth: width + gutter,
    y0: round2(pad),
    y1: round2(height - pad),
  };
}
