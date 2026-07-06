// Portable kernel — pure functions, zero React (plan/03). Re-exported so charts
// (and future non-React renderers) import from one place.
export { round2, isFiniteValue, type Value, type XY, type Polarity } from "./types.js";
export { scaleLinear, clamp, extent, niceDomain, type Scale } from "./scale.js";
export { seriesStats, type SeriesStats } from "./stats.js";
export { linePath, smoothPath, stepPath, areaPath, type Curve } from "./path.js";
export { bankTo45 } from "./bank.js";
export { OKABE_ITO, SEMANTIC, CATEGORICAL, categoricalToken } from "./color.js";
export { describeSeries, EN, type SummaryStrings, type DescribeOptions } from "./summary.js";
