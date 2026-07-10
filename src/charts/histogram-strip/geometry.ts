// HistogramStrip geometry — pure, React-free (plan/22 #15, S1 distribution).
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
  const binned = uniformBins(values, {
    ...(opts.bins !== undefined ? { bins: Math.max(1, Math.min(opts.bins, finiteCount)) } : null),
    ...(opts.domain ? { domain: opts.domain } : null),
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
