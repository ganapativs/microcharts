// Uniform bins, counts zero-anchored, never density-smoothed. `markValue` is a
// VALUE whose bin gets accent — it marks the bin, never re-bins around the
// value. 2-dp.
import { uniformBins } from "../../core/bin.js";
import { round2, type Value } from "../../core/types.js";

interface HistogramBar {
  x: number;
  y: number;
  w: number;
  h: number;
  count: number;
  x0: number;
  x1: number;
  index: number;
}

export interface HistogramGeometry {
  bars: HistogramBar[];
  /** Bin index for a marked value (−1 = none). */
  markBin: number;
  /** Modal bin (largest count), or −1. */
  modalBin: number;
  total: number;
  /** Bar pitch for interactive band lookup. */
  pitch: number;
}

export function histogramGeometry(opts: {
  width: number;
  height: number;
  values: readonly Value[];
  domain?: readonly [number, number] | undefined;
  bins?: number | undefined;
  gap?: number | undefined;
  markValue?: number | undefined;
}): HistogramGeometry {
  const { width, height, values, gap = 0.5, markValue } = opts;
  // explicit bin counts collapse to the observation count (no empty-comb)
  let finiteCount = 0;
  for (const v of values) if (typeof v === "number" && Number.isFinite(v)) finiteCount++;
  // Hosts compute both of these: `bins` off an empty input field (`Number("")`
  // → NaN), `domain` with a Math.min over a series holding a NaN. Passed
  // through, a non-finite `domain` came back as bin edges of NaN — nothing
  // painted, and the name still read "14 values, most between NaN and NaN" —
  // and a non-finite `bins` collapsed the bin array to empty, announcing "No
  // data." over 14 real observations. Neither is a bin count or a domain, so
  // fall back to the documented auto behavior.
  const binCount =
    opts.bins !== undefined && Number.isFinite(opts.bins)
      ? Math.max(1, Math.min(opts.bins, finiteCount))
      : undefined;
  const domain =
    opts.domain && Number.isFinite(opts.domain[0]) && Number.isFinite(opts.domain[1])
      ? opts.domain
      : undefined;
  const binned = uniformBins(values, {
    ...(binCount !== undefined ? { bins: binCount } : null),
    ...(domain ? { domain } : null),
  });
  if (!binned || binned.bins.length === 0) {
    return { bars: [], markBin: -1, modalBin: -1, total: 0, pitch: 0 };
  }

  const n = binned.bins.length;
  const barW = (width - gap * (n - 1)) / n;
  const pitch = barW + gap;
  const usableH = height - 0.5;

  let modalBin = -1;
  const bars: HistogramBar[] = binned.bins.map((b, index) => {
    if (modalBin < 0 || b.count > binned.bins[modalBin]!.count) modalBin = index;
    const h = binned.maxCount > 0 ? round2((b.count / binned.maxCount) * usableH) : 0;
    const x = round2(index * pitch);
    return {
      x,
      y: round2(height - h),
      w: round2(Math.min(barW, round2(width - x))),
      h,
      count: b.count,
      x0: round2(b.x0),
      x1: round2(b.x1),
      index,
    };
  });

  return {
    bars,
    markBin: markValue !== undefined && Number.isFinite(markValue) ? binned.binOf(markValue) : -1,
    modalBin,
    total: binned.total,
    pitch,
  };
}
