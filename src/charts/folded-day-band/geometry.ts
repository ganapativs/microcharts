// FoldedDayBand geometry — pure, React-free. Folds
// many periods onto one period axis: per-bin quantile envelopes (25–75, 5–95)
// + a median line, optionally a "today" overlay. Envelopes come from REAL per-
// bin quantiles, never smoothed across bins into shapes the data doesn't
// support; band edges fade so the outer boundary doesn't read as a hard limit.
// 2-dp.
import { quantiles } from "../../core/quantile.js";
import { isFiniteValue, round2 } from "../../core/types.js";

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

function foldBins(data: readonly TP[], period: number, bins: number): number[][] {
  const buckets: number[][] = Array.from({ length: bins }, () => []);
  for (const d of data) {
    if (!isFiniteValue(d.value) || !Number.isFinite(d.t)) continue;
    const pos = ((d.t % period) + period) % period;
    let b = Math.floor((pos / period) * bins);
    if (b >= bins) b = bins - 1;
    if (b < 0) b = 0;
    buckets[b]!.push(d.value);
  }
  return buckets;
}

export function foldedBandGeometry(opts: {
  data: readonly TP[];
  today: readonly TP[] | null;
  period: number;
  bins: number;
  bands: readonly [number, number][];
  width: number;
  height: number;
}): FoldedBandResult {
  const { data, today, period, bins, bands, width, height } = opts;
  const pad = 1;
  const plotW = width - pad * 2;
  const plotH = height - pad * 2;
  const buckets = foldBins(data, period, bins);

  // percentiles per bin
  const ps = [0.5, ...bands.flatMap(([lo, hi]) => [lo / 100, hi / 100])];
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
  const bandPaths: string[] = bands.map((_pair, bi) => {
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
