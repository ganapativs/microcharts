// Stacked-composition summary templates — a separate MODULE (see
// strings-scalar.ts for the chunk rationale).
import type { SummaryStrings } from "./summary.js";

export type StackStrings = Pick<
  SummaryStrings,
  "noData" | "stackAt" | "shareShift" | "seriesFallback"
>;

export const EN_STACK: StackStrings = {
  noData: "No data.",
  stackAt: (pos, total, clauses) => `Point ${pos} of ${total}: ${clauses}.`,
  seriesFallback: (pos) => `Series ${pos}`,
  shareShift: (count, points, topLabel, topPct) =>
    `${count} series over ${points} points; ${topLabel} leads at ${topPct} share.`,
};
