// Portable kernel — pure functions, zero React (plan/03). Re-exported so charts
// (and future non-React renderers) import from one place.
export { round2, isFiniteValue, type Value, type XY, type Polarity } from "./types.js";
export { scaleLinear, clamp, extent, niceDomain, type Scale } from "./scale.js";
export { seriesStats, type SeriesStats } from "./stats.js";
export { linePath, smoothPath, stepPath, areaPath, type Curve } from "./path.js";
export { bankTo45 } from "./bank.js";
export { OKABE_ITO, SEMANTIC, CATEGORICAL, categoricalToken } from "./color.js";
export { makeFormatter, type Format } from "./format.js";
export {
  describeSeries,
  EN_SERIES,
  type SummaryStrings,
  type SeriesStrings,
  type DescribeOptions,
} from "./summary.js";
export { EN_SCALAR, type ScalarStrings } from "./strings-scalar.js";
export { EN } from "./strings.js";
export {
  quantiles,
  fiveNumber,
  quantileDotplot,
  type FiveNumber,
  type Dotplot,
  type DotplotDot,
} from "./quantile.js";
export { uniformBins, type Bin, type UniformBins } from "./bin.js";
export {
  TAU,
  polarPoint,
  arcTo,
  arcPath,
  sector,
  annulusSector,
  arcLength,
  evenDashes,
} from "./arc.js";
export {
  stackSeries,
  normalizeShares,
  divergingStack,
  type StackLayer,
  type StackedSeries,
  type DivergingSegment,
  type DivergingStack,
} from "./stack.js";
export { maxPerBucket, envelope, decimateMinMax, type IndexedValue } from "./downsample.js";
export {
  parseUTCDay,
  isoDate,
  weekGrid,
  dayOfYear,
  daysInYear,
  monthStartDays,
  type CalendarDay,
  type WeekGrid,
} from "./calendar.js";
export { hashSeed, seeded, jitter } from "./jitter.js";
