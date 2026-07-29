// MicroBox: Box =
// IQR span, tick = median; whiskers min-max (honest default for small n) or
// tukey (1.5×IQR fences, outliers as dots, ≤ 3 rendered per side). Never a box
// from fewer than 5 observations — degenerate honesty handled by the caller.
import { fiveNumber, type FiveNumber } from "../../core/quantile.js";
import { clamp, maxOf, minOf, scaleLinear } from "../../core/scale.js";
import { isFiniteValue, round2, type Value } from "../../core/types.js";

type StatX = Record<"min" | "q1" | "median" | "q3" | "max", number>;

const PAD = 1.5;

/**
 * The value → x mapping, shared by the box path and the small-n dot path.
 * Both entries must place marks and hit-test in the SAME space, so the scale
 * lives here rather than being re-derived per call site.
 */
function axis(
  domain: readonly [number, number] | undefined,
  fallback: readonly [number, number],
  width: number,
): (v: number) => number {
  let d = domain && domain.every((n) => Number.isFinite(n)) ? domain : fallback;
  if (d[0] === d[1]) d = [d[0] - 1, d[1] + 1];
  return (v) => round2(clamp(scaleLinear(d, [PAD, width - PAD])(v), PAD, width - PAD));
}

const statsX = (x: (v: number) => number, five: FiveNumber): StatX => ({
  min: x(five.min),
  q1: x(five.q1),
  median: x(five.median),
  q3: x(five.q3),
  max: x(five.max),
});

export interface MicroBoxDots {
  /** x per raw observation, in input order. */
  dots: number[];
  /** x for each of the five stats, on the scale that placed those dots. */
  statX: StatX;
}

/**
 * Small-n placement: below 5 observations the chart paints honest raw dots
 * rather than a fake box. Returned alongside `statX` on one scale so the
 * painted dots and the interactive hit-testing cannot drift apart.
 */
export function microBoxDots(opts: {
  raw: readonly number[];
  width: number;
  five: FiveNumber;
  domain?: readonly [number, number] | undefined;
}): MicroBoxDots {
  const { raw, width, five } = opts;
  const x = axis(opts.domain, [five.min, five.max], width);
  return { dots: raw.map(x), statX: statsX(x, five) };
}

export interface MicroBoxGeometry {
  whisker: { x0: number; x1: number; y: number };
  box: { x: number; y: number; w: number; h: number };
  medianX: number;
  outliers: { x: number; y: number }[];
  /** x position for each of the five stats (interactive 5-stop roving). */
  statX: StatX;
  /** The five numbers actually drawn (whisker ends per mode). */
  five: FiveNumber;
  /**
   * Count of outliers NOT rendered (cap 3/side). The three drawn per side are
   * the FURTHEST, so the extremes always paint and the summary's stated range
   * stays true; the clipped ones sit between the last dot and the fence. No
   * caller reads this yet — announcing the outlier count needs a
   * `SummaryStrings` token.
   */
  clippedOutliers: number;
}

export function computeFive(
  data: readonly Value[] | undefined,
  stats: FiveNumber | undefined,
): { five: FiveNumber; raw: number[] } | null {
  if (stats) {
    const { min, q1, median, q3, max } = stats;
    const ordered = min <= q1 && q1 <= median && median <= q3 && q3 <= max;
    if (!ordered || ![min, q1, median, q3, max].every(Number.isFinite)) return null;
    return { five: stats, raw: [] };
  }
  if (!data) return null;
  const raw = data.filter(isFiniteValue);
  const five = fiveNumber(raw);
  if (!five) return null;
  return { five, raw };
}

export function microBoxGeometry(opts: {
  width: number;
  height: number;
  five: FiveNumber;
  /** Raw values (tukey outlier detection); empty for precomputed stats. */
  raw: readonly number[];
  whiskers: "minmax" | "tukey";
  domain?: readonly [number, number] | undefined;
}): MicroBoxGeometry {
  const { width, height, five, raw, whiskers } = opts;

  const iqr = five.q3 - five.q1;
  const loFence = five.q1 - 1.5 * iqr;
  const hiFence = five.q3 + 1.5 * iqr;

  // tukey whiskers end at the most extreme value INSIDE the fences
  let lo = five.min;
  let hi = five.max;
  let outlierValues: number[] = [];
  if (whiskers === "tukey" && raw.length > 0) {
    const inside = raw.filter((v) => v >= loFence && v <= hiFence);
    if (inside.length > 0) {
      lo = minOf(inside);
      hi = maxOf(inside);
    }
    outlierValues = raw.filter((v) => v < loFence || v > hiFence);
  }

  const x = axis(opts.domain, [Math.min(five.min, lo), Math.max(five.max, hi)], width);

  const midY = round2(height / 2);
  // 4 units is the floor that keeps the box readable in a short chart — but the
  // floor used to be applied unconditionally, so below height 4 the box grew
  // TALLER than the frame and painted above and below it (`.mc-root` is
  // overflow: visible, so that is a spill, not a clip). Cap it at the frame.
  // No-op at every height ≥ 4, which is every size the chart actually ships at.
  const boxH = Math.min(height, Math.max(4, height - 5));
  // degenerate IQR → 1-unit tick, still distinct from the median tick by height
  const boxW = Math.max(1, round2(x(five.q3) - x(five.q1)));

  // cap 3 outlier dots per side (furthest), count the clipped
  const below = outlierValues.filter((v) => v < loFence).sort((a, b) => a - b);
  const above = outlierValues.filter((v) => v > hiFence).sort((a, b) => b - a);
  const drawn = [...below.slice(0, 3), ...above.slice(0, 3)];

  return {
    whisker: { x0: x(lo), x1: x(hi), y: midY },
    box: { x: x(five.q1), y: round2(midY - boxH / 2), w: boxW, h: round2(boxH) },
    medianX: x(five.median),
    outliers: drawn.map((v) => ({ x: x(v), y: midY })),
    statX: statsX(x, five),
    five,
    clippedOutliers: outlierValues.length - drawn.length,
  };
}
