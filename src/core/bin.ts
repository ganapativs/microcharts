// Uniform binning (plan/21 §6.0.C). Histogram-class charts bin raw
// observations here; counts stay zero-anchored and are never smoothed.
// Outputs are data-space (charts scale + round to viewBox).
import { isFiniteValue, type Value } from "./types.js";

export interface Bin {
  /** Inclusive lower edge. */
  x0: number;
  /** Upper edge — exclusive except for the last bin, which is closed. */
  x1: number;
  count: number;
  /** count / total counted values; 0 when nothing was counted. */
  share: number;
}

export interface UniformBins {
  bins: Bin[];
  /** Bin width; 0 for a degenerate (all-equal) domain. */
  step: number;
  /** Values actually counted (finite + inside the domain). */
  total: number;
  maxCount: number;
  domain: readonly [number, number];
  /** Bin index for a value; −1 for non-finite or outside the domain. */
  binOf: (value: number) => number;
}

/**
 * Bins finite values into ≤ 12 uniform bins by default (auto count =
 * min(12, ⌈√n⌉, n) — enough shape to see skew, few enough bars for 60 px; an
 * explicit `bins` is honored as given so shared edges across small multiples
 * stay exact). `domain` fixes the edges (values outside it are NOT counted —
 * callers overfetching a window is normal); without it the data extent is
 * used. Half-open bins, last bin closed (a value at the max lands in the top
 * bin, never an off-by-one 13th). Returns null when nothing is finite.
 * All-equal without a domain → a single full-count bin (never twelve slivers).
 */
export function uniformBins(
  values: readonly Value[],
  opts: { bins?: number; domain?: readonly [number, number] } = {},
): UniformBins | null {
  const finite: number[] = [];
  for (const v of values) if (isFiniteValue(v)) finite.push(v);
  const n = finite.length;
  if (n === 0) return null;

  let d0: number;
  let d1: number;
  if (opts.domain) {
    [d0, d1] = opts.domain;
    if (d1 < d0) [d0, d1] = [d1, d0];
  } else {
    d0 = Infinity;
    d1 = -Infinity;
    for (const v of finite) {
      if (v < d0) d0 = v;
      if (v > d1) d1 = v;
    }
  }

  if (d0 === 0) d0 = 0; // never carry -0 into edges
  if (d1 === 0) d1 = 0;

  const span = d1 - d0;
  const k =
    span === 0 ? 1 : Math.max(1, Math.round(opts.bins ?? Math.min(12, Math.ceil(Math.sqrt(n)), n)));
  const step = span / k;

  const binOf = (value: number): number => {
    if (!isFiniteValue(value) || value < d0 || value > d1) return -1;
    if (step === 0) return 0;
    return Math.min(k - 1, Math.floor((value - d0) / step));
  };

  const counts = Array.from({ length: k }, () => 0);
  let total = 0;
  for (const v of finite) {
    const i = binOf(v);
    if (i === -1) continue;
    counts[i]!++;
    total++;
  }

  let maxCount = 0;
  const bins: Bin[] = counts.map((count, i) => {
    if (count > maxCount) maxCount = count;
    return {
      x0: d0 + i * step,
      x1: i === k - 1 ? d1 : d0 + (i + 1) * step,
      count,
      share: total === 0 ? 0 : count / total,
    };
  });

  return { bins, step, total, maxCount, domain: [d0, d1], binOf };
}

/** Alias — batch docs reference both `bin.uniformBins` and `bin.uniform`. */
export const uniform = uniformBins;
