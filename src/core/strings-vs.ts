// Dual-series (benchmark) summary templates — a separate MODULE (see
// strings-scalar.ts for the chunk rationale).
import type { SummaryStrings } from "./summary.js";

export type VsStrings = Pick<SummaryStrings, "noData" | "vsAt" | "vs" | "vsMatching">;

export const EN_VS: VsStrings = {
  noData: "No data.",
  vsAt: (pos, total, v, ref) => `Point ${pos} of ${total}: ${v} vs ${ref}.`,
  vs: (primary, compare, lastV, lastRef) =>
    `${primary} vs benchmark ${compare}. Last ${lastV} vs ${lastRef}.`,
  vsMatching: "Matching benchmark.",
};
