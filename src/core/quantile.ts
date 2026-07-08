// Quantile machinery (plan/21 §6.0.C). Feeds five-number boxes, graded bands,
// percentile reads, and quantile dotplots. R-7 linear interpolation — the
// default in most analytics tools, so a chart's median matches the user's
// spreadsheet. Outputs are data-space (charts scale + round to viewBox).
import { isFiniteValue, type Value } from "./types.js";

export interface FiveNumber {
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
}

/** Finite values only, ascending. `.sort()` on a fresh array (ES2022 floor). */
function sortedFinite(values: readonly Value[]): number[] {
  const out: number[] = [];
  for (const v of values) if (isFiniteValue(v)) out.push(v);
  return out.sort((a, b) => a - b);
}

/** R-7 quantile of an ascending array. `p` is clamped to [0, 1]. */
function quantileSorted(sorted: readonly number[], p: number): number {
  const n = sorted.length;
  const q = p < 0 ? 0 : p > 1 ? 1 : p;
  const h = (n - 1) * q;
  const lo = Math.floor(h);
  const hi = Math.min(lo + 1, n - 1);
  const frac = h - lo;
  return sorted[lo]! + (sorted[hi]! - sorted[lo]!) * frac;
}

/**
 * Quantiles at the given probabilities, ignoring null/NaN/±Infinity. Returns
 * null when nothing is plottable (empty, all-null) — the shared degenerate
 * convention (see `extent`, `seriesStats`). Probabilities outside [0, 1] are
 * clamped; NaN probabilities yield NaN (garbage in, visible out — never a
 * plausible-looking number).
 */
export function quantiles(values: readonly Value[], ps: readonly number[]): number[] | null {
  const sorted = sortedFinite(values);
  if (sorted.length === 0) return null;
  return ps.map((p) => (Number.isFinite(p) ? quantileSorted(sorted, p) : NaN));
}

/**
 * Five-number summary (min, q1, median, q3, max). Null when nothing finite.
 * A single value collapses all five to that value — callers decide whether a
 * degenerate box is honest to draw (micro-box refuses below 5 observations).
 */
export function fiveNumber(values: readonly Value[]): FiveNumber | null {
  const sorted = sortedFinite(values);
  if (sorted.length === 0) return null;
  return {
    min: sorted[0]!,
    q1: quantileSorted(sorted, 0.25),
    median: quantileSorted(sorted, 0.5),
    q3: quantileSorted(sorted, 0.75),
    max: sorted[sorted.length - 1]!,
  };
}

/** One dotplot dot: its true quantile value + grid position (column, row). */
export interface DotplotDot {
  /** The underlying quantile value — threshold counts use this, not the bin. */
  value: number;
  /** Column index, 0-based from `x0`. */
  column: number;
  /** Stack row within the column, 0-based bottom-up. */
  row: number;
}

export interface Dotplot {
  dots: DotplotDot[];
  /** Number of columns actually laid out (≤ requested `bins`). */
  columns: number;
  /** Data-space width of one column; 0 when all quantiles coincide. */
  binWidth: number;
  /** Data-space value at the left edge of column 0. */
  x0: number;
  /** Tallest stack — drives dot radius at the chart layer. */
  maxStack: number;
}

/**
 * Quantile-dotplot binning (Kay/Fernandes): `count` equal-probability
 * quantiles at p = (i − 0.5)/count, rounded into `bins` uniform columns and
 * stacked bottom-up. Each dot keeps its true quantile value so "N in `count`
 * past a threshold" is computed on the data, never the bin center. Null when
 * nothing finite. All-equal input → one column of height `count`.
 */
export function quantileDotplot(
  values: readonly Value[],
  count = 20,
  bins?: number,
): Dotplot | null {
  const sorted = sortedFinite(values);
  if (sorted.length === 0) return null;

  const n = Math.max(1, Math.round(count));
  const qs: number[] = [];
  for (let i = 1; i <= n; i++) qs.push(quantileSorted(sorted, (i - 0.5) / n));

  const x0 = qs[0]!;
  const range = qs[n - 1]! - x0;
  const columns = range === 0 ? 1 : Math.max(1, Math.round(bins ?? Math.ceil(n / 2)));
  const binWidth = range === 0 ? 0 : range / columns;

  const stacks = Array.from({ length: columns }, () => 0);
  const dots: DotplotDot[] = [];
  for (const q of qs) {
    const column = binWidth === 0 ? 0 : Math.min(columns - 1, Math.floor((q - x0) / binWidth));
    dots.push({ value: q, column, row: stacks[column]! });
    stacks[column]!++;
  }

  let maxStack = 0;
  for (const s of stacks) if (s > maxStack) maxStack = s;

  return { dots, columns, binWidth, x0, maxStack };
}
