// CalibrationStrip geometry — pure, React-free. When
// a model says 70%, does it happen 70% of the time — and is there enough data to
// even ask. Predicted × observed against the identity diagonal, with an
// ALWAYS-ON support lane (per-bin counts) so tiny bins never look authoritative.
// 2-dp.
import { uniformBins } from "../../core/bin.js";
import { isFiniteValue, round2 } from "../../core/types.js";

export interface RawPair {
  p: number;
  outcome: number;
}
export interface BinnedRow {
  predicted: number;
  observed: number;
  count: number;
}

export interface CalibrationPoint {
  x: number;
  y: number;
  predicted: number;
  observed: number;
  count: number;
  lowSupport: boolean;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Frame inset. The support lane's columns stand on `height - PAD`, so it is
 *  also the whole mark's floor — shared with the static entry's seat. */
export const PAD = 1;

export function isBinned(data: readonly (RawPair | BinnedRow)[]): data is readonly BinnedRow[] {
  return data.length > 0 && "predicted" in data[0]!;
}

/** Reduce raw pairs to per-bin { predicted midpoint, observed frequency, count }. */
export function binRaw(pairs: readonly RawPair[], bins: number): BinnedRow[] {
  const ub = uniformBins(
    pairs.map((d) => d.p),
    { bins, domain: [0, 1] },
  );
  if (!ub) return [];
  const sum = Array.from({ length: ub.bins.length }, () => 0);
  const cnt = Array.from({ length: ub.bins.length }, () => 0);
  for (const d of pairs) {
    const i = ub.binOf(d.p);
    if (i < 0) continue;
    sum[i] = (sum[i] ?? 0) + (d.outcome === 1 ? 1 : 0);
    cnt[i] = (cnt[i] ?? 0) + 1;
  }
  return ub.bins.map((b, i) => {
    const c = cnt[i] ?? 0;
    return {
      predicted: (b.x0 + b.x1) / 2,
      observed: c > 0 ? (sum[i] ?? 0) / c : 0,
      count: c,
    };
  });
}

export function calibrationGeometry(opts: {
  data: readonly (RawPair | BinnedRow)[];
  bins: number;
  minSupport: number;
  width: number;
  height: number;
  supportHeight: number;
}): {
  points: CalibrationPoint[];
  diagonal: { x1: number; y1: number; x2: number; y2: number };
  supportBars: Rect[];
  maxGap: { predicted: number; observed: number } | null;
  rows: BinnedRow[];
} {
  const { data, bins, minSupport, width, height, supportHeight } = opts;
  const rows = isBinned(data) ? [...data] : binRaw(data as RawPair[], bins);

  const pad = PAD;
  const plotW = width - pad * 2;
  const supportTop = height - pad - supportHeight;
  const plotH = supportTop - pad - 1;
  const xOf = (p: number): number => round2(pad + Math.max(0, Math.min(1, p)) * plotW);
  const yOf = (o: number): number => round2(pad + (1 - Math.max(0, Math.min(1, o))) * plotH);

  // A bin is only plottable when all three numbers are real: a non-finite count
  // poisons `count / maxCount` (∞/∞ = NaN) and a non-finite rate has no position
  // on either lane. Guarded here, where the numbers enter geometry.
  const withCount = rows.filter(
    (r) =>
      isFiniteValue(r.count) &&
      r.count > 0 &&
      isFiniteValue(r.predicted) &&
      isFiniteValue(r.observed),
  );
  const maxCount = withCount.reduce((m, r) => Math.max(m, r.count), 0) || 1;

  const points: CalibrationPoint[] = withCount.map((r) => ({
    x: xOf(r.predicted),
    y: yOf(r.observed),
    predicted: round2(r.predicted),
    observed: round2(r.observed),
    count: r.count,
    lowSupport: r.count < minSupport,
  }));

  const barW = (plotW / Math.max(1, bins)) * 0.7;
  const supportBars: Rect[] = withCount.map((r) => {
    const h = round2((r.count / maxCount) * supportHeight);
    return {
      x: round2(xOf(r.predicted) - barW / 2),
      y: round2(height - pad - h),
      width: round2(barW),
      height: h,
    };
  });

  let maxGap: { predicted: number; observed: number } | null = null;
  let gap = -1;
  for (const r of withCount) {
    const g = Math.abs(r.observed - r.predicted);
    if (g > gap) {
      gap = g;
      maxGap = { predicted: round2(r.predicted), observed: round2(r.observed) };
    }
  }

  return {
    points,
    diagonal: { x1: xOf(0), y1: yOf(0), x2: xOf(1), y2: yOf(1) },
    supportBars,
    maxGap,
    rows: withCount,
  };
}
