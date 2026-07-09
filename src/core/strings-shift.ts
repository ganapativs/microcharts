// ShiftHistogram summary templates (shift-histogram) — its OWN module (see
// strings-scalar.ts for the chunk rationale). English lives only in core string
// modules (canon). Aggregate: core/strings.ts `EN`.
import type { SummaryStrings } from "./summary.js";

export type ShiftStrings = Pick<
  SummaryStrings,
  "noData" | "shift" | "shiftHeld" | "shiftSamples" | "shiftOneSide" | "shiftBin"
>;

export const EN_SHIFT: ShiftStrings = {
  noData: "No data.",
  shift: (direction, before, after) => `Median ${direction} from ${before} to ${after}.`,
  shiftHeld: (value) => `Median unchanged at ${value}.`,
  shiftSamples: (nBefore, nAfter) => ` On ${nBefore} / ${nAfter} samples.`,
  shiftOneSide: (value, missing) => `Median ${value}; no ${missing} sample.`,
  shiftBin: (lo, hi, beforePct, afterPct) => `${lo}–${hi}: ${beforePct} before, ${afterPct} after.`,
};
