// BenchmarkStrip geometry — pure, React-free. Is this
// value normal for its peer group? A focal dot positioned against EMPIRICAL
// quantile bands of the supplied peers — never a fitted distribution, no axis
// (the band IS the reference frame). Small samples fall back to min–max so tail
// quantiles are never fiction. Coords 2-dp.
import { quantiles } from "../../core/quantile.js";
import { clamp, extent, scaleLinear } from "../../core/scale.js";
import { isFiniteValue, round2, type Value } from "../../core/types.js";

export interface BenchmarkStripGeometry {
  /** Outer band (p5–95 or min–max) in viewBox x. */
  outer: { x: number; width: number };
  /** Inner middle-half band (p25–75). */
  inner: { x: number; width: number };
  median: { x: number; value: number };
  /** Focal dot; `clamped` ≠ 0 ⇒ value fell beyond the strip. */
  dot: { x: number; value: number; clamped: -1 | 0 | 1 };
  /** Empirical percentile of the focal value, 0–100 integer (mid-rank rule). */
  percentile: number;
  /** Peer count (finite). */
  n: number;
  /** All peers equal — bands collapse to one tick. */
  flat: boolean;
  /** n < 8 forced the min–max fallback. */
  smallN: boolean;
  /** Middle-half bounds (data space) for summaries/announces. */
  p25: number;
  p75: number;
  /** The five quantile edges for interactive roving (name, x, value). */
  edges: { name: string; x: number; value: number }[];
  bandY: number;
  bandH: number;
  labelX: number;
  labelY: number;
  totalWidth: number;
}

/** Mid-rank empirical percentile: 100·(below + 0.5·ties)/n, so ties don't bias. */
export function empiricalPercentile(sorted: readonly number[], value: number): number {
  const n = sorted.length;
  if (n === 0) return 0;
  let below = 0;
  let ties = 0;
  for (const v of sorted) {
    if (v < value) below++;
    else if (v === value) ties++;
  }
  return Math.round((100 * (below + 0.5 * ties)) / n);
}

export function benchmarkStripGeometry(opts: {
  width: number;
  height: number;
  data: readonly Value[];
  value: number;
  range?: "p5p95" | "minmax";
  domain?: readonly [number, number] | undefined;
  gutterCh?: number;
  fontSize?: number;
}): BenchmarkStripGeometry | null {
  const { width, height, value } = opts;
  const pad = 3;
  const gutterCh = opts.gutterCh ?? 0;
  const fontSize = opts.fontSize ?? 0;
  const gutter = gutterCh > 0 ? Math.ceil(gutterCh * fontSize * 0.62) + 4 : 0;

  const finite = opts.data.filter(isFiniteValue);
  const n = finite.length;
  if (n === 0 || !isFiniteValue(value)) return null;
  const sorted = [...finite].sort((a, b) => a - b);

  const qs = quantiles(finite, [0.05, 0.25, 0.5, 0.75, 0.95])!;
  const [p5, p25, p50, p75, p95] = qs as [number, number, number, number, number];
  const min = sorted[0]!;
  const max = sorted[n - 1]!;

  const smallN = n < 8;
  const useMinmax = smallN || opts.range === "minmax";
  const outerLo = useMinmax ? min : p5;
  const outerHi = useMinmax ? max : p95;
  const flat = min === max;

  const dataDomain: readonly [number, number] =
    opts.domain && opts.domain.every((d) => Number.isFinite(d))
      ? opts.domain
      : (extent([...finite, value]) ?? [0, 1]);
  const domain: readonly [number, number] =
    dataDomain[0] === dataDomain[1] ? [dataDomain[0] - 1, dataDomain[1] + 1] : dataDomain;

  const scale = scaleLinear(domain, [pad, width - pad]);
  const x = (v: number) => round2(clamp(scale(v), pad, width - pad));

  const bandH = round2(Math.max(3, height * 0.5));
  const bandY = round2((height - bandH) / 2);

  const rawDotX = scale(value);
  const clamped: -1 | 0 | 1 = rawDotX < pad ? -1 : rawDotX > width - pad ? 1 : 0;

  return {
    outer: { x: x(outerLo), width: round2(x(outerHi) - x(outerLo)) },
    inner: { x: x(p25), width: round2(x(p75) - x(p25)) },
    median: { x: x(p50), value: round2(p50) },
    dot: { x: x(value), value: round2(value), clamped },
    percentile: empiricalPercentile(sorted, value),
    n,
    flat,
    smallN,
    p25: round2(p25),
    p75: round2(p75),
    edges: [
      { name: useMinmax ? "min" : "p5", x: x(outerLo), value: round2(outerLo) },
      { name: "p25", x: x(p25), value: round2(p25) },
      { name: "p50", x: x(p50), value: round2(p50) },
      { name: "p75", x: x(p75), value: round2(p75) },
      { name: useMinmax ? "max" : "p95", x: x(outerHi), value: round2(outerHi) },
    ],
    bandY,
    bandH,
    labelX: width + gutter,
    labelY: round2(height / 2),
    totalWidth: width + gutter,
  };
}
