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

export const EN: SummaryStrings = {
  ...EN_SERIES,
  ...EN_SCALAR,
  ...EN_CATEGORY,
  ...EN_DIST,
  ...EN_SLOTS,
  ...EN_PAIRED,
  ...EN_SCATTER,
};
