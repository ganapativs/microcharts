// Banking to 45° (plan/03, plan/06 §5). Suggests a width so the median absolute
// segment slope renders near 45° — the aspect ratio at which slope differences
// are most perceptible (Cleveland). A suggestion only; callers may override.
import { isFiniteValue, round2, type Value } from "./types.js";

function median(sorted: number[]): number {
  const n = sorted.length;
  if (n === 0) return 0;
  const mid = n >> 1;
  return n % 2 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2;
}

/**
 * Given the series and a rendered `height` (viewBox units), returns a suggested
 * `width`. Uses median absolute slope over unit-x steps between consecutive
 * finite points. Degenerate series (flat, < 2 points) fall back to a 4:1
 * aspect. Result is clamped to [height, height * 20] to stay word-sized.
 */
export function bankTo45(values: readonly Value[], height: number): number {
  const finite: number[] = [];
  for (const v of values) if (isFiniteValue(v)) finite.push(v);

  const n = finite.length;
  if (n < 2) return round2(height * 4);

  let min = finite[0]!;
  let max = finite[0]!;
  const slopes: number[] = [];
  for (let i = 0; i < n; i++) {
    const v = finite[i]!;
    if (v < min) min = v;
    if (v > max) max = v;
    if (i > 0) slopes.push(Math.abs(v - finite[i - 1]!));
  }

  const yRange = max - min;
  if (yRange === 0) return round2(height * 4);

  const medSlope = median(slopes.toSorted((a, b) => a - b));
  if (medSlope === 0) return round2(height * 4);

  // pixel slope = (medSlope * height / yRange) / (width / (n - 1)) = 1
  const width = (medSlope * height * (n - 1)) / yRange;
  const clamped = Math.min(Math.max(width, height), height * 20);
  return round2(clamped);
}
