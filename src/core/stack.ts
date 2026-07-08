// Stacking + share math (plan/21 §6.0.C). Compositions are zero-anchored
// (lie factor = 1) and share one scale — never independently scaled to
// balance the picture. Outputs are data-space (charts scale + round).
import { isFiniteValue, type Value } from "./types.js";

export interface StackLayer {
  /** Cumulative lower edge per x position. */
  y0: readonly number[];
  /** Cumulative upper edge per x position (y0 + this layer's value). */
  y1: readonly number[];
  /** True where this layer had no usable value (null/NaN/±Infinity/short
   *  series) — stacked as 0, but charts must surface the gap, never hide it. */
  missing: readonly boolean[];
}

export interface StackedSeries {
  layers: StackLayer[];
  /** Column totals (the top of the stack per x position). */
  totals: readonly number[];
}

/**
 * Zero-anchored cumulative stacking, bottom-up in input order. Series of
 * unequal length stack over the longest one (short series are missing at the
 * tail). Negative values are clamped to 0 — a stacked composition cannot
 * contain negatives; the consuming chart raises the dev error, the kernel
 * just refuses to render a lying overlap. Empty input → empty layers/totals.
 */
export function stackSeries(series: readonly (readonly Value[])[]): StackedSeries {
  let n = 0;
  for (const s of series) if (s.length > n) n = s.length;

  const cumulative = Array.from({ length: n }, () => 0);
  const layers: StackLayer[] = series.map((s) => {
    const y0: number[] = [];
    const y1: number[] = [];
    const missing: boolean[] = [];
    for (let i = 0; i < n; i++) {
      const raw = i < s.length ? s[i] : null;
      const usable = isFiniteValue(raw);
      const v = usable ? Math.max(0, raw) : 0;
      const top = cumulative[i]! + v;
      y0.push(cumulative[i]!);
      y1.push(top);
      missing.push(!usable);
      cumulative[i] = top;
    }
    return { y0, y1, missing };
  });

  return { layers, totals: cumulative };
}

/**
 * Composition shares: each positive finite value ÷ the positive total.
 * Zero, negative, and non-finite entries get share 0 (excluded from the
 * total — the consuming chart dev-warns). Returns null when the total is 0
 * (empty, all-null, all-zero) so callers render their designed empty state.
 * The last positive share absorbs float dust so shares sum to 1 (a segment
 * bar tiles its full width after 2-dp coordinate rounding).
 */
export function normalizeShares(
  values: readonly Value[],
): { shares: readonly number[]; total: number } | null {
  let total = 0;
  for (const v of values) if (isFiniteValue(v) && v > 0) total += v;
  if (total === 0) return null;

  const shares = values.map((v) => (isFiniteValue(v) && v > 0 ? v / total : 0));
  let sum = 0;
  let biggest = -1;
  for (let i = 0; i < shares.length; i++) {
    if (shares[i]! > 0 && (biggest < 0 || shares[i]! > shares[biggest]!)) biggest = i;
    sum += shares[i]!;
  }
  // fold the float remainder into the LARGEST share — a tiny share could go
  // negative absorbing it (denormal counterexample: [4e-106, 2e-93, 5e-324])
  if (biggest >= 0) shares[biggest] = Math.max(0, shares[biggest]! + (1 - sum));

  return { shares, total };
}

/** Segment coordinates never emit -0 (ugly in SVG output + test assertions). */
const z = (v: number): number => (v === 0 ? 0 : v);

export interface DivergingSegment {
  /** Index into the input array. */
  index: number;
  /** Segment extent in share units (total mass = 1), center at 0; x0 ≤ x1. */
  x0: number;
  x1: number;
  /** −1 negative pole, 0 neutral, 1 positive pole. */
  side: -1 | 0 | 1;
  /** This level's share of the total. */
  share: number;
}

export interface DivergingStack {
  segments: DivergingSegment[];
  /** Pole + neutral shares of the total (sum to 1 with `positive`/`neutral`). */
  negative: number;
  positive: number;
  neutral: number;
}

/**
 * Center-anchored (diverging) stack for valenced levels ordered most-negative
 * → most-positive. Levels below `neutralIndex` stack leftward from center,
 * levels above stack rightward; the neutral level either straddles the center
 * (`"split"`, half each side) or is removed from the bar (`"omit"`) — its
 * share is ALWAYS reported so the label/summary can carry it (neutral is
 * never silently dropped). `neutralIndex` defaults to the middle index for an
 * odd level count, none for even. Negative counts are treated as 0 (the chart
 * dev-warns). Shares are relative to the grand total including neutral even
 * when omitted — an `omit` bar is honestly shorter, never re-inflated.
 * An explicit `neutralIndex: null` on an odd count puts the middle level on
 * the negative side (levels below the count's midpoint lean negative).
 * Returns null when the total is 0.
 */
export function divergingStack(
  values: readonly Value[],
  opts: { neutralIndex?: number | null; neutral?: "split" | "omit" } = {},
): DivergingStack | null {
  const n = values.length;
  const neutralIndex =
    opts.neutralIndex !== undefined ? opts.neutralIndex : n % 2 === 1 ? (n - 1) / 2 : null;
  const mode = opts.neutral ?? "split";

  const counts = values.map((v) => (isFiniteValue(v) && v > 0 ? v : 0));
  let total = 0;
  for (const c of counts) total += c;
  if (total === 0) return null;

  const split = neutralIndex;
  const splitAt = split ?? n / 2; // even count: halves meet at center exactly
  const neutralShare = split !== null && split >= 0 && split < n ? counts[split]! / total : 0;

  let negative = 0;
  let positive = 0;
  for (let i = 0; i < n; i++) {
    if (split !== null && i === split) continue;
    const share = counts[i]! / total;
    if (i < splitAt) negative += share;
    else positive += share;
  }

  const half = mode === "split" ? neutralShare / 2 : 0;
  const segments: DivergingSegment[] = [];

  // negative pole: level adjacent to center sits at the center edge, the
  // most-negative level farthest left
  let edge = -half;
  for (let i = Math.ceil(splitAt) - 1; i >= 0; i--) {
    if (split !== null && i === split) continue;
    const share = counts[i]! / total;
    segments.push({ index: i, x0: z(edge - share), x1: z(edge), side: -1, share });
    edge -= share;
  }

  if (split !== null && split >= 0 && split < n && mode === "split") {
    segments.push({ index: split, x0: z(-half), x1: half, side: 0, share: neutralShare });
  }

  edge = half;
  for (let i = Math.ceil(splitAt); i < n; i++) {
    if (split !== null && i === split) continue;
    const share = counts[i]! / total;
    segments.push({ index: i, x0: edge, x1: edge + share, side: 1, share });
    edge += share;
  }

  segments.sort((a, b) => a.index - b.index);
  return { segments, negative, positive, neutral: neutralShare };
}
