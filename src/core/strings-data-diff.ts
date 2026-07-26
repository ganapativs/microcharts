// DataDiff summary templates (data-diff)
import type { SummaryStrings } from "./summary.js";

export type DataDiffStrings = Pick<
  SummaryStrings,
  "noData" | "dataDiff" | "dataDiffEmpty" | "dataDiffAt"
>;

export const EN_DATA_DIFF: DataDiffStrings = {
  noData: "No data.",
  dataDiff: (added, removed, n, key, net) =>
    `+${added} added, −${removed} removed across ${n} keys; largest change: ${key} (${net}).`,
  dataDiffEmpty: (n) => `No changes across ${n} keys.`,
  dataDiffAt: (key, added, removed, net) =>
    `${key}: +${added} added, −${removed} removed, net ${net}.`,
};
