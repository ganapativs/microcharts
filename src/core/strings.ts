// The full locale dictionary — every template, composed from the per-shape
// modules. Import THIS for app-level i18n (it types against the complete
// `SummaryStrings` contract); individual charts import only their shape's
// module so a 12-px glyph never bundles series templates.
import { EN_SERIES, type SummaryStrings } from "./summary.js";
import { EN_SCALAR } from "./strings-scalar.js";
import { EN_TALLY } from "./strings-tally.js";
import { EN_DICE } from "./strings-dice.js";
import { EN_FILL_WORD } from "./strings-fill-word.js";
import { EN_FAT } from "./strings-fat.js";
import { EN_THERMOMETER } from "./strings-thermometer.js";
import { EN_MOON } from "./strings-moon.js";
import { EN_HOURGLASS } from "./strings-hourglass.js";
import { EN_BEAM } from "./strings-beam.js";
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
import { EN_QUANTILE_DOTS } from "./strings-quantile-dots.js";
import { EN_RATE_VOLUME } from "./strings-rate-volume.js";
import { EN_NET_FLOW } from "./strings-net-flow.js";
import { EN_RETENTION } from "./strings-retention.js";
import { EN_BURN } from "./strings-burn.js";
import { EN_ERROR_BUDGET } from "./strings-error-budget.js";
import { EN_CONTROL } from "./strings-control.js";
import { EN_FORECAST } from "./strings-forecast.js";
import { EN_AB } from "./strings-ab.js";
import { EN_SHIFT } from "./strings-shift.js";
import { EN_PARETO } from "./strings-pareto.js";
import { EN_DATA_DIFF } from "./strings-data-diff.js";
import { EN_QUADRANT } from "./strings-quadrant.js";
import { EN_CYCLE } from "./strings-cycle.js";
import { EN_CHANGE_POINT } from "./strings-change-point.js";
import { EN_ENSEMBLE } from "./strings-ensemble.js";

export const EN: SummaryStrings = {
  ...EN_SERIES,
  ...EN_SCALAR,
  ...EN_TALLY,
  ...EN_DICE,
  ...EN_FILL_WORD,
  ...EN_FAT,
  ...EN_THERMOMETER,
  ...EN_MOON,
  ...EN_HOURGLASS,
  ...EN_BEAM,
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
  ...EN_QUANTILE_DOTS,
  ...EN_RATE_VOLUME,
  ...EN_NET_FLOW,
  ...EN_RETENTION,
  ...EN_BURN,
  ...EN_ERROR_BUDGET,
  ...EN_CONTROL,
  ...EN_FORECAST,
  ...EN_AB,
  ...EN_SHIFT,
  ...EN_PARETO,
  ...EN_DATA_DIFF,
  ...EN_QUADRANT,
  ...EN_CYCLE,
  ...EN_CHANGE_POINT,
  ...EN_ENSEMBLE,
};
