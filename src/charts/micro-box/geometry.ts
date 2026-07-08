// MicroBox geometry — pure, React-free (plan/22 #16, S2 five-number). Box =
// IQR span, tick = median; whiskers min-max (honest default for small n) or
// tukey (1.5×IQR fences, outliers as dots, ≤ 3 rendered per side). Never a box
// from fewer than 5 observations — degenerate honesty handled by the caller.
import { fiveNumber, type FiveNumber } from "../../core/quantile.js";
import { clamp, scaleLinear } from "../../core/scale.js";
import { isFiniteValue, round2, type Value } from "../../core/types.js";

export interface MicroBoxGeometry {
  whisker: { x0: number; x1: number; y: number };
  box: { x: number; y: number; w: number; h: number };
  medianX: number;
  outliers: { x: number; y: number }[];
  /** x position for each of the five stats (interactive 5-stop roving). */
  statX: Record<"min" | "q1" | "median" | "q3" | "max", number>;
  /** The five numbers actually drawn (whisker ends per mode). */
  five: FiveNumber;
  /** Count of outliers NOT rendered (cap 3/side; carried in the summary). */
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
  const pad = 1.5;

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
      lo = Math.min(...inside);
      hi = Math.max(...inside);
    }
    outlierValues = raw.filter((v) => v < loFence || v > hiFence);
  }

  let domain =
    opts.domain && opts.domain.every((d) => Number.isFinite(d))
      ? opts.domain
      : ([Math.min(five.min, lo), Math.max(five.max, hi)] as const);
  if (domain[0] === domain[1]) domain = [domain[0] - 1, domain[1] + 1];
  const x = (v: number) =>
    round2(clamp(scaleLinear(domain, [pad, width - pad])(v), pad, width - pad));

  const midY = round2(height / 2);
  const boxH = Math.max(4, height - 5);
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
    statX: {
      min: x(five.min),
      q1: x(five.q1),
      median: x(five.median),
      q3: x(five.q3),
      max: x(five.max),
    },
    five,
    clippedOutliers: outlierValues.length - drawn.length,
  };
}
