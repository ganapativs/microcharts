// QuantileDots: What are the odds, in
// COUNTABLE form? A quantile dotplot: `count` dots at equal-probability
// quantiles (Kay/Fernandes binning from core/quantile). stacked bottom-up. Each
// dot ≈ a 1-in-count chance — NOT a raw observation — so "N past a threshold" is
// counted on the true quantile value, never the bin. Coords 2-dp, integer viewBox.
import { quantileDotplot } from "../../core/quantile.js";
import { clamp, maxOf, minOf } from "../../core/scale.js";
import { chartSide, round2 } from "../../core/types.js";

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
  /**
   * Data-space frame — the fixed `domain` when one is given, else the dotplot's
   * own span. Lets the interactive probe invert pointer x → value.
   */
  x0: number;
  range: number;
  columns: number;
  pad: number;
  labelX: number;
  labelY: number;
  totalWidth: number;
}

const FLOOR_R = 1.25;
const DEFAULT_COUNT = 20;

/**
 * Dots to lay out, clamped to the documented 1–25. Hosts compute this (an empty
 * number field's `Number("")`, a config lookup), and a non-finite one used to
 * survive both clamps: `quantileDotplot` then laid out ZERO dots while the
 * accessible name still announced "0 in NaN chances above 15" over a
 * normal-looking plot. Not a count, so fall back to the documented default.
 * Exported because the interactive entry sizes its odds gutter off the same
 * number — resolving it twice let the two disagree about the box.
 */
export function resolveCount(count: number | undefined): number {
  return count !== undefined && Number.isFinite(count)
    ? Math.max(1, Math.min(25, Math.round(count)))
    : DEFAULT_COUNT;
}

/**
 * Width reserved to the right of the plot for the "N in count" odds label.
 * Shared with the interactive entry, which must map the pointer across the same
 * box the static paints — a re-derived formula there would drift by the gutter.
 */
export function oddsGutter(gutterCh: number, fontSize: number): number {
  return gutterCh > 0 ? Math.ceil(gutterCh * fontSize * 0.72) + 4 : 0;
}

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
  const count = resolveCount(opts.count);
  const plot = quantileDotplot(opts.data, count);
  if (plot === null) return null;

  // `Chart` clamps the viewBox, but marks laid out against a raw non-finite
  // width/height land as NaN coordinates inside a valid frame (see `chartSide`).
  const width = chartSide(opts.width);
  const height = chartSide(opts.height);
  const pad = opts.pad ?? 2;
  const gutter = oddsGutter(opts.gutterCh ?? 0, opts.fontSize ?? 0);
  const side = opts.side ?? "above";

  const plotW = width - 2 * pad;
  const plotH = height - 2 * pad;
  const baseline = height - pad;

  // The value→x frame. `domain` fixes it so dotplots stacked down a table read
  // on one scale; a non-finite or inverted pair is not a domain (a host's
  // `Math.min` over a series holding a NaN), so it falls back to the plot's own
  // span like every other chart in the grammar. Dots, threshold and the
  // interactive probe's inversion all read this one frame.
  const span = plot.binWidth * plot.columns;
  const dom = opts.domain;
  const fixed =
    dom && Number.isFinite(dom[0]) && Number.isFinite(dom[1]) && dom[1] > dom[0] ? dom : null;
  const x0 = fixed ? fixed[0] : plot.x0;
  const range = fixed ? fixed[1] - fixed[0] : span;

  // data value → x (column centers fall out of this same linear map)
  const dataToX = (v: number): number =>
    range === 0 ? pad + plotW / 2 : pad + clamp((v - x0) / range, 0, 1) * plotW;
  const colX = (c: number): number => dataToX(plot.x0 + (c + 0.5) * plot.binWidth);

  // Radius fits the column width, the tallest stack, and the distance to the
  // frame edge — under a fixed domain the columns cover only part of the plot,
  // so a `plotW / columns` width would overlap the dots, and a column parked
  // against the edge would paint outside the viewBox (`.mc-root` never clips).
  const colW = plot.binWidth > 0 && range > 0 ? (plot.binWidth / range) * plotW : plotW;
  let edge = plotW;
  for (let c = 0; c < plot.columns; c++) {
    const cx = colX(c);
    edge = Math.min(edge, cx, width - cx);
  }
  const rFit = Math.min(colW * 0.46, (plotH / plot.maxStack) * 0.46, edge);
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
    x0: round2(x0),
    range: round2(range),
    columns: plot.columns,
    pad,
    labelX: round2(width + 3),
    labelY: round2(height / 2),
    totalWidth: width + gutter,
  };
}
