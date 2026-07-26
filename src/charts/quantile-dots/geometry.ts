// QuantileDots: What are the odds, in
// COUNTABLE form? A quantile dotplot: `count` dots at equal-probability
// quantiles (Kay/Fernandes binning from core/quantile). stacked bottom-up. Each
// dot ≈ a 1-in-count chance — NOT a raw observation — so "N past a threshold" is
// counted on the true quantile value, never the bin. Coords 2-dp, integer viewBox.
import { quantileDotplot } from "../../core/quantile.js";
import { clamp, maxOf, minOf } from "../../core/scale.js";
import { round2 } from "../../core/types.js";

export type ThresholdSide = "above" | "below";

export interface QuantileDotsGeometry {
  dots: { x: number; y: number; r: number; past: boolean }[];
  threshold: { x: number } | null;
  /** Dots past the threshold. */
  past: number;
  count: number;
  /** Modal (tallest) column value bounds, for the no-threshold summary. */
  mode: { lo: number; hi: number };
  min: number;
  max: number;
  /** Data-space frame — lets the interactive probe invert pointer x → value. */
  x0: number;
  range: number;
  columns: number;
  pad: number;
  labelX: number;
  labelY: number;
  totalWidth: number;
}

const FLOOR_R = 1.25;

export function quantileDotsGeometry(opts: {
  width: number;
  height: number;
  data: readonly number[];
  count?: number | undefined;
  threshold?: number | undefined;
  side?: ThresholdSide | undefined;
  domain?: readonly [number, number] | undefined;
  pad?: number | undefined;
  gutterCh?: number | undefined;
  fontSize?: number | undefined;
}): QuantileDotsGeometry | null {
  const count = Math.max(1, Math.min(25, Math.round(opts.count ?? 20)));
  const plot = quantileDotplot(opts.data, count);
  if (plot === null) return null;

  const { width, height } = opts;
  const pad = opts.pad ?? 2;
  const gutterCh = opts.gutterCh ?? 0;
  const fontSize = opts.fontSize ?? 0;
  const gutter = gutterCh > 0 ? Math.ceil(gutterCh * fontSize * 0.72) + 4 : 0;
  const side = opts.side ?? "above";

  const plotW = width - 2 * pad;
  const plotH = height - 2 * pad;
  const baseline = height - pad;

  const range = plot.binWidth * plot.columns;
  // data value → x (column centers fall out of this same linear map)
  const dataToX = (v: number): number =>
    range === 0 ? pad + plotW / 2 : pad + clamp((v - plot.x0) / range, 0, 1) * plotW;
  const colX = (c: number): number =>
    range === 0 ? pad + plotW / 2 : pad + ((c + 0.5) / plot.columns) * plotW;

  // radius fits both the column width and the tallest stack
  const colW = plot.columns > 0 ? plotW / plot.columns : plotW;
  const rFit = Math.min(colW * 0.46, (plotH / plot.maxStack) * 0.46);
  const r = round2(Math.max(FLOOR_R, rFit));
  // The radius floor can make a tall stack taller than the plot. Tighten the row
  // step so the column spans the plot (dots touch, then overlap) instead of the
  // overflow rows piling up on one clamped y — every dot must stay countable.
  const fitStep = plot.maxStack > 1 ? (plotH - 2 * r) / (plot.maxStack - 1) : 2 * r;
  const step = Math.max(0.1, Math.min(2 * r, fitStep));

  const th = opts.threshold;
  const isPast = (v: number): boolean =>
    th === undefined || !Number.isFinite(th) ? false : side === "above" ? v > th : v < th;

  const dots = plot.dots.map((d) => ({
    x: round2(colX(d.column)),
    y: round2(clamp(baseline - r - d.row * step, pad, baseline)),
    r,
    past: isPast(d.value),
  }));
  const past = plot.dots.filter((d) => isPast(d.value)).length;

  // modal column bounds (for the no-threshold summary)
  let modeCol = 0;
  let modeH = -1;
  const colCounts = Array.from<number>({ length: plot.columns }).fill(0);
  for (const d of plot.dots) colCounts[d.column]!++;
  colCounts.forEach((h, c) => {
    if (h > modeH) {
      modeH = h;
      modeCol = c;
    }
  });
  const modeLo = plot.x0 + modeCol * plot.binWidth;
  const modeHi = plot.x0 + (modeCol + 1) * plot.binWidth;

  const values = plot.dots.map((d) => d.value);

  return {
    dots,
    threshold: th !== undefined && Number.isFinite(th) ? { x: round2(dataToX(th)) } : null,
    past,
    count,
    mode: { lo: round2(modeLo), hi: round2(modeHi) },
    min: round2(minOf(values)),
    max: round2(maxOf(values)),
    x0: round2(plot.x0),
    range: round2(range),
    columns: plot.columns,
    pad,
    labelX: round2(width + 3),
    labelY: round2(height / 2),
    totalWidth: width + gutter,
  };
}
