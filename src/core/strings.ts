// The full locale dictionary — every template, composed from the per-shape
// modules. Import THIS for app-level i18n (it types against the complete
// `SummaryStrings` contract); individual charts import only their shape's
// module so a 12-px glyph never bundles series templates.
import { EN_SERIES, type SummaryStrings } from "./summary.js";
import { EN_SCALAR } from "./strings-scalar.js";

export const EN: SummaryStrings = {
  ...EN_SERIES,
  ...EN_SCALAR,
};
