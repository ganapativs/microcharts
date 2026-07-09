// Coverage / presence summary templates (coverage-strip) — a separate MODULE
// (see strings-scalar.ts for why bundlers keep whole chunks). English lives
// only in core string modules (canon). Aggregate dictionary: core/strings.ts `EN`.
import type { SummaryStrings } from "./summary.js";

export type CoverageStrings = Pick<SummaryStrings, "noData" | "coverage" | "coverageSlot">;

export const EN_COVERAGE: CoverageStrings = {
  noData: "No data.",
  coverage: (measured, expected, pct, gap) =>
    `${measured} of ${expected} slots measured (${pct}); longest gap ${gap} ${gap === 1 ? "slot" : "slots"}.`,
  coverageSlot: (slot, value) =>
    value === null ? `Slot ${slot}: no measurement.` : `Slot ${slot}: ${value}.`,
};
