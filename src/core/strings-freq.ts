// Frequency-framing summary templates (icon-array; quantile-dots later) "3 in 20" reads
// better than "15%" for lay audiences.
import type { SummaryStrings } from "./summary.js";

export type FreqStrings = Pick<
  SummaryStrings,
  "noData" | "iconArray" | "iconArrayRatio" | "iconArrayUnit" | "iconArrayChip"
>;

export const EN_FREQ: FreqStrings = {
  noData: "No data.",
  iconArray: (k, n, pct, note) => {
    if (note === "all") return `${k} in ${n} — all.`;
    if (note === "none") return `0 in ${n}.`;
    if (note === "sub") return `0 in ${n} (less than 1 in ${n}). About ${pct}.`;
    return `${k} in ${n}. About ${pct}.`;
  },
  iconArrayRatio: (k, n) => `${k} in ${n}`,
  iconArrayUnit: (index, n, filled, filledCount) =>
    `Unit ${index} of ${n} — ${filled ? "filled" : "empty"}. ${filledCount} of ${n} filled.`,
  iconArrayChip: (index, n, filled) => `${index} of ${n} — ${filled ? "filled" : "empty"}`,
};
