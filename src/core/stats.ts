// Series statistics — feeds a11y summaries + mark placement (plan/03, plan/08).
import { isFiniteValue, type Value } from "./types.js";

export interface SeriesStats {
  count: number; // finite values only
  min: number;
  max: number;
  minIndex: number; // index in the ORIGINAL array
  maxIndex: number;
  first: number;
  last: number;
  firstIndex: number;
  lastIndex: number;
  sum: number;
  mean: number;
  /** last - first */
  delta: number;
  /** (last - first) / |first|; 0 when first is 0 (undefined ratio, reported flat) */
  deltaRatio: number;
  /** sign(last - first): -1 down, 0 flat, 1 up */
  trend: -1 | 0 | 1;
}

/**
 * Reduces a series to its summary stats, ignoring null/NaN/±Infinity. Returns
 * null when no finite value exists (empty / all-null) — the documented
 * degenerate case (plan/03 §4, plan/09 edge matrix). Indices point back into
 * the original array so marks land on the right x position even with gaps.
 */
export function seriesStats(values: readonly Value[]): SeriesStats | null {
  let count = 0;
  let min = Infinity;
  let max = -Infinity;
  let minIndex = -1;
  let maxIndex = -1;
  let first = 0;
  let firstIndex = -1;
  let last = 0;
  let lastIndex = -1;
  let sum = 0;

  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    if (!isFiniteValue(v)) continue;
    count++;
    sum += v;
    if (v < min) {
      min = v;
      minIndex = i;
    }
    if (v > max) {
      max = v;
      maxIndex = i;
    }
    if (firstIndex === -1) {
      first = v;
      firstIndex = i;
    }
    last = v;
    lastIndex = i;
  }

  if (count === 0) return null;

  const delta = last - first;
  const deltaRatio = first === 0 ? 0 : delta / Math.abs(first);
  const trend: -1 | 0 | 1 = delta > 0 ? 1 : delta < 0 ? -1 : 0;

  return {
    count,
    min,
    max,
    minIndex,
    maxIndex,
    first,
    last,
    firstIndex,
    lastIndex,
    sum,
    mean: sum / count,
    delta,
    deltaRatio,
    trend,
  };
}
