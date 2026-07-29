// FoldedDayBand: Folds
// many periods onto one period axis: per-bin quantile envelopes (25–75, 5–95)
// + a median line, optionally a "today" overlay. Envelopes come from REAL per-
// bin quantiles, never smoothed across bins into shapes the data doesn't
// support; band edges fade so the outer boundary doesn't read as a hard limit.
// 2-dp.
import { quantiles } from "../../core/quantile.js";
import { isFiniteValue, round2 } from "../../core/types.js";

/** Default band pair. Shared by BOTH entries so their defaults are one
 *  object: a literal default is a fresh array per render, which defeats the
 *  interactive entry's geometry memo (and drifts the two entries apart). */
export const DEFAULT_PERCENTILES: readonly [number, number][] = [
  [25, 75],
  [5, 95],
];

/** Default fold length, in `t` units — one day. Shared by both entries and by
 *  `resolvePeriod`, so the fallback and the prop default cannot drift apart. */
export const DEFAULT_PERIOD = 24;

export interface TP {
  t: number;
  value: number;
}

interface FoldedBinStat {
  bin: number;
  x: number;
  median: number;
  q1: number;
  q3: number;
  count: number;
}

export interface FoldedBandResult {
  bandPaths: string[];
  medianPath: string;
  todayPath: string | null;
  peak: { bin: number; median: number };
  todayPercentile: number | null;
  bins: number;
  binStats: FoldedBinStat[];
  /** Plot box, top and bottom edges — the padded frame every envelope and the
   *  median line are scaled into. */
  y0: number;
  y1: number;
}

/** Bin ceiling — one bin is one drawn column, and `bins` is caller data: an
 *  unclamped `bins={1e9}` allocates an array per bin and exhausts memory. */
const MAX_BINS = 512;

/** The bin count actually used, resolved ONCE per geometry call. Every consumer
 *  — the buckets, the x scale, the reported `bins`, the axis labels — must
 *  share it: clamping inside the bucketing alone left the x scale dividing by
 *  the raw prop, which collapsed the whole plot into a sliver at the left edge
 *  (and reported a bin count that was never drawn). Exported so `binPosition`
 *  labels the axis the geometry actually drew. */
export function resolveBins(bins: number): number {
  return Number.isFinite(bins) ? Math.min(MAX_BINS, Math.max(1, Math.floor(bins))) : 1;
}

/** The fold length actually used. `period` is caller config — an empty input
 *  field gives `Number("") → NaN`, and 0 / ±Infinity make `t % period` NaN, so
 *  every reading piled into bin 0 while the summary announced "Median peaks at
 *  NaN". A fold length that is not a positive finite number cannot fold; fall
 *  back to the documented default so the announced axis is the drawn axis. */
export function resolvePeriod(period: number): number {
  return Number.isFinite(period) && period > 0 ? period : DEFAULT_PERIOD;
}

/** viewBox extents, resolved the way `Chart` resolves them. `Chart` clamps a
 *  non-finite box to 1 for the viewBox; geometry scaling by the raw prop
 *  instead emitted NaN in every coord (and a NaN `--mc-seat`) under a
 *  perfectly confident accessible name. Both sides read the same box. */
function resolveExtent(n: number): number {
  return Number.isFinite(n) && n > 0 ? n : 1;
}

/** `period` and `n` are already resolved by the caller — both fold passes (the
 *  pooled history and the `today` overlay) must land on one identical grid. */
function foldBins(data: readonly TP[], period: number, n: number): number[][] {
  const buckets: number[][] = Array.from({ length: n }, () => []);
  for (const d of data) {
    if (!isFiniteValue(d.value) || !Number.isFinite(d.t)) continue;
    const pos = ((d.t % period) + period) % period;
    let b = Math.floor((pos / period) * n);
    if (!Number.isFinite(b) || b < 0) b = 0;
    if (b >= n) b = n - 1;
    buckets[b]!.push(d.value);
  }
  return buckets;
}

export function foldedBandGeometry(opts: {
  data: readonly TP[];
  today: readonly TP[] | null;
  period: number;
  bins: number;
  percentiles: readonly [number, number][];
  width: number;
  height: number;
}): FoldedBandResult {
  const { data, today } = opts;
  // Resolve the config props once — the buckets, the x scale, the reported
  // `bins` and the announced fold position all have to agree.
  const bins = resolveBins(opts.bins);
  const period = resolvePeriod(opts.period);
  const width = resolveExtent(opts.width);
  const height = resolveExtent(opts.height);
  // An envelope whose percentile is not a finite number cannot be computed:
  // `quantiles` returns NaN for it by design, and that NaN reached both the
  // band's path `d` (which the browser then drops whole) and `binStats.q1/q3`,
  // which the interactive readout painted as "middle half NaN–NaN". Drop the
  // pair rather than draw an envelope nobody can see.
  const percentiles = opts.percentiles.filter(
    ([lo, hi]) => Number.isFinite(lo) && Number.isFinite(hi),
  );
  const pad = 1;
  const plotW = width - pad * 2;
  const plotH = height - pad * 2;
  const buckets = foldBins(data, period, bins);

  // percentiles per bin
  const ps = [0.5, ...percentiles.flatMap(([lo, hi]) => [lo / 100, hi / 100])];
  const perBin = buckets.map((vals) => quantiles(vals, ps));

  // domain from all finite values
  let lo = Infinity;
  let hi = -Infinity;
  for (const v of data)
    if (isFiniteValue(v.value)) {
      if (v.value < lo) lo = v.value;
      if (v.value > hi) hi = v.value;
    }
  if (today)
    for (const v of today)
      if (isFiniteValue(v.value)) {
        if (v.value < lo) lo = v.value;
        if (v.value > hi) hi = v.value;
      }
  if (!Number.isFinite(lo)) {
    lo = 0;
    hi = 1;
  }
  const span = hi - lo || 1;
  const xOf = (b: number): number => round2(pad + (bins > 1 ? b / (bins - 1) : 0.5) * plotW);
  const yOf = (v: number): number => round2(pad + (1 - (v - lo) / span) * plotH);

  // band areas (outermost drawn first / faintest — bands ordered inner→outer,
  // we reverse for z-order in the component)
  const bandPaths: string[] = percentiles.map((_pair, bi) => {
    const loIdx = 1 + bi * 2;
    const hiIdx = 2 + bi * 2;
    const top: string[] = [];
    const bottom: string[] = [];
    perBin.forEach((q, b) => {
      if (!q) return;
      top.push(`${xOf(b)} ${yOf(q[hiIdx]!)}`);
      bottom.push(`${xOf(b)} ${yOf(q[loIdx]!)}`);
    });
    if (top.length === 0) return "";
    return `M${top.join("L")}L${bottom.reverse().join("L")}Z`;
  });

  // median line
  const medPts: string[] = [];
  let peakBin = 0;
  let peakMed = -Infinity;
  perBin.forEach((q, b) => {
    if (!q) return;
    medPts.push(`${xOf(b)} ${yOf(q[0]!)}`);
    if (q[0]! > peakMed) {
      peakMed = q[0]!;
      peakBin = b;
    }
  });
  const medianPath = medPts.length > 0 ? `M${medPts.join("L")}` : "";

  // per-bin stats for the interactive readout (uses the first band as q1/q3)
  const binStats: FoldedBinStat[] = [];
  perBin.forEach((q, b) => {
    if (!q) return;
    binStats.push({
      bin: b,
      x: xOf(b),
      median: round2(q[0]!),
      q1: round2(q[1] ?? q[0]!),
      q3: round2(q[2] ?? q[0]!),
      count: buckets[b]!.length,
    });
  });

  // today overlay (median per bin)
  let todayPath: string | null = null;
  let todayPercentile: number | null = null;
  if (today && today.length > 0) {
    const tBuckets = foldBins(today, period, bins);
    const tPts: string[] = [];
    tBuckets.forEach((vals, b) => {
      const q = quantiles(vals, [0.5]);
      if (q) tPts.push(`${xOf(b)} ${yOf(q[0]!)}`);
    });
    todayPath = tPts.length > 0 ? `M${tPts.join("L")}` : null;

    // today's overall level vs the pooled distribution
    const pooled = data.map((d) => d.value).filter(isFiniteValue);
    const tVals = today.map((d) => d.value).filter(isFiniteValue);
    if (pooled.length > 0 && tVals.length > 0) {
      const tMean = tVals.reduce((a, b) => a + b, 0) / tVals.length;
      const below = pooled.filter((v) => v <= tMean).length;
      todayPercentile = round2((below / pooled.length) * 100);
    }
  }

  return {
    bandPaths,
    medianPath,
    todayPath,
    peak: { bin: peakBin, median: Number.isFinite(peakMed) ? round2(peakMed) : 0 },
    todayPercentile,
    bins,
    binStats,
    y0: round2(pad),
    y1: round2(pad + plotH),
  };
}
