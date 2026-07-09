// Portable kernel — pure functions, zero React (plan/03). Re-exported so charts
// (and future non-React renderers) import from one place.
export { round2, isFiniteValue, type Value, type XY, type Polarity } from "./types.js";
export { scaleLinear, clamp, extent, niceDomain, type Scale } from "./scale.js";
export { seriesStats, type SeriesStats } from "./stats.js";
export { linePath, smoothPath, stepPath, areaPath, type Curve } from "./path.js";
export { bankTo45 } from "./bank.js";
export { OKABE_ITO, SEMANTIC, CATEGORICAL, categoricalToken } from "./color.js";
export { makeDateFormatter, type DateFormat, makeFormatter, type Format } from "./format.js";
export {
  describeSeries,
  EN_SERIES,
  type SummaryStrings,
  type SeriesStrings,
  type DescribeOptions,
} from "./summary.js";
export { EN_SCALAR, type ScalarStrings } from "./strings-scalar.js";
export { EN_CATEGORY, type CategoryStrings } from "./strings-category.js";
export { EN_DIST, type DistStrings } from "./strings-dist.js";
export { EN_SLOTS, type SlotStrings } from "./strings-slots.js";
export { EN_PAIRED, type PairedStrings } from "./strings-paired.js";
export { EN_SCATTER, type ScatterStrings } from "./strings-scatter.js";
export { EN_COMPOSITION, type CompositionStrings } from "./strings-composition.js";
export { EN_FLOW, type FlowStrings } from "./strings-flow.js";
export { EN_VS, type VsStrings } from "./strings-vs.js";
export { EN_STACK, type StackStrings } from "./strings-stack.js";
export { EN_OHLC, type OhlcStrings } from "./strings-ohlc.js";
export { EN_CALENDAR, type CalendarStrings } from "./strings-calendar.js";
export { EN_TIMELINE, type TimelineStrings } from "./strings-timeline.js";
export { EN } from "./strings.js";
export { EN_TIME_IN_RANGE, type TimeInRangeStrings } from "./strings-time-in-range.js";
export { EN_HYPNOGRAM, type HypnogramStrings } from "./strings-hypnogram.js";
export { EN_ETA_BAR, type EtaBarStrings } from "./strings-eta-bar.js";
export { EN_WAVEFORM, type WaveformStrings } from "./strings-waveform.js";
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
export { spreadLabels } from "./labels.js";
export { parseUTCDay } from "./calendar.js";
export {
  isoDate,
  weekGrid,
  dayOfYear,
  daysInYear,
  monthStartDays,
  type CalendarDay,
  type WeekGrid,
} from "./calendar-grid.js";
export { hashSeed, seeded, jitter } from "./jitter.js";
