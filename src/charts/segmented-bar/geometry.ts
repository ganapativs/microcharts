// SegmentedBar: Parts of a whole
// as segment lengths in one fixed-length bar. > maxSegments → top-(max−1) by
// value + a labeled "Other" rollup: nothing is ever silently dropped. 2-dp.
import { normalizeShares } from "../../core/stack.js";
import { isFiniteValue, round2, type Value } from "../../core/types.js";

export interface Segment {
  x: number;
  w: number;
  share: number;
  /** Whether a centered label fits (deterministic char estimate). */
  labelFits: (chars: number) => boolean;
  /** Index into the ROLLED data (rollup entry = the last index). */
  index: number;
}

export interface RolledDatum {
  label: string;
  value: number;
  /** Number of source categories merged into this entry (1 = passthrough). */
  members: number;
}

/** Rollup threshold both entries default to (one literal, never two). */
export const MAX_SEGMENTS = 5;

/** Top-(max−1) by value + "Other" rollup, preserving data order for the kept. */
export function rollup(
  data: readonly { label: string; value: Value }[],
  maxSegments: number,
  otherLabel: string,
): RolledDatum[] {
  // A host-computed threshold walked straight into `slice(0, max - 1)`:
  // `Number("")` → NaN sliced nothing and rolled EVERY category into a single
  // "Other" bar, and 0 sliced from the END, returning six segments for a max of
  // zero. Below 1 there is no composition left to show.
  const max = Number.isFinite(maxSegments) ? Math.max(1, Math.floor(maxSegments)) : MAX_SEGMENTS;
  const positive = data.filter((d) => isFiniteValue(d.value) && d.value > 0) as {
    label: string;
    value: number;
  }[];
  if (positive.length <= max) {
    return positive.map((d) => ({ label: d.label, value: d.value, members: 1 }));
  }
  const sorted = [...positive].sort((a, b) => b.value - a.value);
  const keep = new Set(sorted.slice(0, max - 1));
  const kept: RolledDatum[] = positive
    .filter((d) => keep.has(d))
    .map((d) => ({ label: d.label, value: d.value, members: 1 }));
  const others = positive.filter((d) => !keep.has(d));
  kept.push({
    label: otherLabel,
    value: others.reduce((s, d) => s + d.value, 0),
    members: others.length,
  });
  return kept;
}

/** Integer percents that sum to exactly 100 (largest remainder, documented). */
export function largestRemainderPercents(shares: readonly number[]): number[] {
  // normalize first: callers pass raw values as readily as shares, and either
  // can carry a sum that drifts off 1, which would break the exactly-100
  // invariant. An overflowing sum (two 1e308 categories) makes every ratio 0,
  // and the leftover loop can only hand out one point per entry — the result
  // would sum to the entry count, not 100, so it takes the no-data branch.
  const sum = shares.reduce((a, b) => a + b, 0);
  if (!(sum > 0) || !Number.isFinite(sum)) return shares.map(() => 0);
  const raw = shares.map((s) => (s / sum) * 100);
  const floors = raw.map(Math.floor);
  let leftover = 100 - floors.reduce((a, b) => a + b, 0);
  const order = raw.map((v, i) => ({ i, frac: v - Math.floor(v) })).sort((a, b) => b.frac - a.frac);
  for (const { i } of order) {
    if (leftover <= 0) break;
    floors[i]!++;
    leftover--;
  }
  return floors;
}

export function segmentedBarGeometry(opts: {
  width: number;
  height: number;
  values: readonly number[];
  gap?: number | undefined;
  fontSize: number;
}): { segments: Segment[] } {
  const { width, values, gap = 0.5, fontSize } = opts;
  const norm = normalizeShares(values);
  if (!norm) return { segments: [] };

  const n = norm.shares.filter((s) => s > 0).length;
  const usable = width - gap * Math.max(0, n - 1);
  const segments: Segment[] = [];
  let x = 0;
  norm.shares.forEach((share, index) => {
    if (share <= 0) return;
    const xr = round2(x);
    const w = round2(Math.min(share * usable, round2(width - xr)));
    segments.push({
      x: xr,
      w,
      share: round2(share),
      labelFits: (chars) => chars * fontSize * 0.62 <= w - 1,
      index,
    });
    x += share * usable + gap;
  });
  return { segments };
}
