// Honeycomb summary templates (honeycomb) — its OWN module. Occupancy of
// capacity as a countable filled/total. English lives only in core string
// modules (canon). Aggregate: core/strings.ts `EN`.
import type { SummaryStrings } from "./summary.js";

export type HoneycombStrings = Pick<SummaryStrings, "noData" | "honeycomb" | "honeycombCell">;

export const EN_HONEYCOMB: HoneycombStrings = {
  noData: "No data.",
  honeycomb: (value, total, unit) =>
    unit ? `${value} of ${total} ${unit} filled.` : `${value} of ${total} filled.`,
  // Per-cell, NOT the whole-comb `honeycomb` template: a cell is one seat, so
  // reusing "7 of 40 filled" for it would assert an occupancy that isn't true.
  honeycombCell: (index, total, filled) =>
    `Cell ${index} of ${total} — ${filled ? "filled" : "empty"}.`,
};
