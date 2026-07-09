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
import { EN_SPROUT } from "./strings-sprout.js";
import { EN_GARDEN } from "./strings-garden.js";
import { EN_BUBBLE } from "./strings-bubble.js";
import { EN_TREE } from "./strings-tree.js";
import { EN_SKYLINE } from "./strings-skyline.js";
import { EN_HONEYCOMB } from "./strings-honeycomb.js";
import { EN_CONSTELLATION } from "./strings-constellation.js";
import { EN_POLAR_CLOCK } from "./strings-polar-clock.js";
import { EN_SPIRAL_YEAR } from "./strings-spiral-year.js";
import { EN_BREATHING_DOT } from "./strings-breathing-dot.js";
import { EN_HEARTBEAT } from "./strings-heartbeat.js";
import { EN_COMET_TRAIL } from "./strings-comet-trail.js";
import { EN_ORBIT_STATUS } from "./strings-orbit-status.js";
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
import { EN_TIME_IN_RANGE } from "./strings-time-in-range.js";
import { EN_HYPNOGRAM } from "./strings-hypnogram.js";
import { EN_ETA_BAR } from "./strings-eta-bar.js";
import { EN_WAVEFORM } from "./strings-waveform.js";
import { EN_EVENT_RASTER } from "./strings-event-raster.js";
import { EN_RUBRIC } from "./strings-rubric.js";
import { EN_TOKEN_CONFIDENCE } from "./strings-token-confidence.js";
import { EN_WIND_BARB } from "./strings-wind-barb.js";
import { EN_STAR_SPOKE } from "./strings-star-spoke.js";
import { EN_MINIMAP } from "./strings-minimap.js";
import { EN_DUAL_WINDOW } from "./strings-dual-window.js";
import { EN_DEPTH_WEDGE } from "./strings-depth-wedge.js";
import { EN_PARTITION } from "./strings-partition.js";
import { EN_CALIBRATION } from "./strings-calibration.js";
import { EN_CONFUSION } from "./strings-confusion.js";
import { EN_FOLDED_BAND } from "./strings-folded-band.js";
import { EN_VOLUME_PROFILE } from "./strings-volume-profile.js";
import { EN_PHASE_TRACE } from "./strings-phase-trace.js";
import { EN_TRACE_FOLD } from "./strings-trace-fold.js";

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
  ...EN_SPROUT,
  ...EN_GARDEN,
  ...EN_BUBBLE,
  ...EN_TREE,
  ...EN_SKYLINE,
  ...EN_HONEYCOMB,
  ...EN_CONSTELLATION,
  ...EN_POLAR_CLOCK,
  ...EN_SPIRAL_YEAR,
  ...EN_BREATHING_DOT,
  ...EN_HEARTBEAT,
  ...EN_COMET_TRAIL,
  ...EN_ORBIT_STATUS,
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
  ...EN_TIME_IN_RANGE,
  ...EN_HYPNOGRAM,
  ...EN_ETA_BAR,
  ...EN_WAVEFORM,
  ...EN_EVENT_RASTER,
  ...EN_RUBRIC,
  ...EN_TOKEN_CONFIDENCE,
  ...EN_WIND_BARB,
  ...EN_STAR_SPOKE,
  ...EN_MINIMAP,
  ...EN_DUAL_WINDOW,
  ...EN_DEPTH_WEDGE,
  ...EN_PARTITION,
  ...EN_CALIBRATION,
  ...EN_CONFUSION,
  ...EN_FOLDED_BAND,
  ...EN_VOLUME_PROFILE,
  ...EN_PHASE_TRACE,
  ...EN_TRACE_FOLD,
};
