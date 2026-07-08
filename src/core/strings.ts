// The full locale dictionary — every template, composed from the per-shape
// modules. Import THIS for app-level i18n (it types against the complete
// `SummaryStrings` contract); individual charts import only their shape's
// module so a 12-px glyph never bundles series templates.
import { EN_SERIES, type SummaryStrings } from "./summary.js";
import { EN_SCALAR } from "./strings-scalar.js";
import { EN_CATEGORY } from "./strings-category.js";
import { EN_DIST } from "./strings-dist.js";
import { EN_SLOTS } from "./strings-slots.js";
import { EN_PAIRED } from "./strings-paired.js";
import { EN_SCATTER } from "./strings-scatter.js";
import { EN_COMPOSITION } from "./strings-composition.js";
import { EN_FLOW } from "./strings-flow.js";
import { EN_VS } from "./strings-vs.js";
import { EN_STACK } from "./strings-stack.js";
import { EN_OHLC } from "./strings-ohlc.js";
import { EN_CALENDAR } from "./strings-calendar.js";
import { EN_TIMELINE } from "./strings-timeline.js";
import { EN_COVERAGE } from "./strings-coverage.js";
import { EN_QUANTILE } from "./strings-quantile.js";
import { EN_FREQ } from "./strings-freq.js";
import { EN_RATE_VOLUME } from "./strings-rate-volume.js";
import { EN_NET_FLOW } from "./strings-net-flow.js";
import { EN_RETENTION } from "./strings-retention.js";
import { EN_BURN } from "./strings-burn.js";

export const EN: SummaryStrings = {
  ...EN_SERIES,
  ...EN_SCALAR,
  ...EN_CATEGORY,
  ...EN_DIST,
  ...EN_SLOTS,
  ...EN_PAIRED,
  ...EN_SCATTER,
  ...EN_COMPOSITION,
  ...EN_FLOW,
  ...EN_VS,
  ...EN_STACK,
  ...EN_OHLC,
  ...EN_CALENDAR,
  ...EN_TIMELINE,
  ...EN_COVERAGE,
  ...EN_QUANTILE,
  ...EN_FREQ,
  ...EN_RATE_VOLUME,
  ...EN_NET_FLOW,
  ...EN_RETENTION,
  ...EN_BURN,
};
