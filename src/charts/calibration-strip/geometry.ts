// CalibrationStrip: When
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

/** Filled scatter dot radius. Geometry owns it — and insets the plot by it —
 *  because a dot is PLACED by its centre but PAINTS a disc: a bin at predicted 1
 *  / observed 1 (the perfectly-calibrated top bin, and the corner of the
 *  identity diagonal) put 0.6 units of ink outside the viewBox, and `.mc-root`
 *  is `overflow: visible`, so that lands on the neighbouring text. */
export const DOT_R = 1.6;

/** Bin ceiling — one bin is one bucket array, one plotted point and one support
 *  column, and `bins` is caller config: `bins={1e8}` exhausted the heap outright
 *  and `bins={Infinity}` reaches `Invalid array length`. */
const MAX_BINS = 512;

/** Documented default, restated here because a non-finite `bins` has to resolve
 *  to it inside geometry too — not just at the prop default. */
const DEFAULT_BINS = 10;

/** The bin count actually used, resolved ONCE so the bucketing and the support
 *  lane's column width share it. Clamping inside the bucketing alone still left
 *  `plotW / Math.max(1, NaN)` sizing the columns, which painted the whole lane
 *  at `x="NaN" width="NaN"` under a scatter that looked perfectly normal. */
export function resolveBins(bins: number): number {
  return Number.isFinite(bins) ? Math.min(MAX_BINS, Math.max(1, Math.floor(bins))) : DEFAULT_BINS;
}

export function isBinned(data: readonly (RawPair | BinnedRow)[]): data is readonly BinnedRow[] {
  return data.length > 0 && "predicted" in data[0]!;
}

/** The support floor actually used. A non-finite `minSupport` made
 *  `count < minSupport` false for every bin, so the strip read as fully
 *  supported and the low-support disclosure — the one reading this chart exists
 *  to force — silently disappeared. Default: max(10, 2% of the samples). */
export function resolveMinSupport(
  data: readonly (RawPair | BinnedRow)[],
  minSupport: number | undefined,
): number {
  if (isFiniteValue(minSupport)) return minSupport;
  const total = isBinned(data)
    ? data.reduce((s, r) => s + (isFiniteValue(r.count) ? r.count : 0), 0)
    : data.length;
  return Math.max(10, Math.round(total * 0.02));
}

/** Reduce raw pairs to per-bin { predicted midpoint, observed frequency, count }. */
export function binRaw(pairs: readonly RawPair[], bins: number): BinnedRow[] {
  const ub = uniformBins(
    pairs.map((d) => d.p),
    { bins: resolveBins(bins), domain: [0, 1] },
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
  const { data, minSupport, width, height, supportHeight } = opts;
  const bins = resolveBins(opts.bins);
  const rows = isBinned(data) ? [...data] : binRaw(data as RawPair[], bins);

  const pad = PAD;
  const plotW = width - pad * 2;
  const supportTop = height - pad - supportHeight;
  const plotH = supportTop - pad - 1;
  // The scatter is inset by the dot radius so the DISC, not just its centre,
  // stays in the frame; the diagonal rides the same scale, so it still passes
  // through where a perfectly-calibrated bin's dot lands.
  const spanW = Math.max(0, plotW - DOT_R * 2);
  const spanH = Math.max(0, plotH - DOT_R * 2);
  const xOf = (p: number): number => round2(pad + DOT_R + Math.max(0, Math.min(1, p)) * spanW);
  const yOf = (o: number): number =>
    round2(pad + DOT_R + (1 - Math.max(0, Math.min(1, o))) * spanH);

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

  const barW = (plotW / bins) * 0.7;
  const supportBars: Rect[] = withCount.map((r) => {
    const h = round2((r.count / maxCount) * supportHeight);
    // A column is centred on its bin's x, so a bin at predicted 0 or 1 hung half
    // a column past the frame. Trim at the frame rather than shift inward: the
    // lane's channel is HEIGHT (the count), which a narrower column still reads,
    // while an off-centre one would stop lining up with its own dot.
    const cx = xOf(r.predicted);
    const x0 = Math.max(pad, cx - barW / 2);
    const x1 = Math.min(width - pad, cx + barW / 2);
    return {
      x: round2(x0),
      y: round2(height - pad - h),
      width: round2(Math.max(0, x1 - x0)),
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

/** The support lane as ONE subpathed `<path>`. Every column carries identical
 *  paint, so `bins` `<rect>` siblings were `bins` nodes saying the same thing —
 *  and at a shared `fill-opacity`, overlapping columns darkened where they met
 *  instead of reading as one lane. Nothing addresses a column individually: the
 *  entrance selector targets the dots, and the picker is nearest-x math. */
export function supportPath(bars: readonly Rect[]): string {
  let d = "";
  for (const b of bars) {
    if (b.width <= 0 || b.height <= 0) continue;
    d += `M${b.x} ${b.y}h${b.width}v${b.height}h${-b.width}Z`;
  }
  return d;
}
