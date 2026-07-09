// Honeycomb summary templates (honeycomb) — its OWN module. Occupancy of
// capacity as a countable filled/total. English lives only in core string
// modules (canon). Aggregate: core/strings.ts `EN`.
import type { SummaryStrings } from "./summary.js";

export type HoneycombStrings = Pick<SummaryStrings, "noData" | "honeycomb">;

export const EN_HONEYCOMB: HoneycombStrings = {
  noData: "No data.",
  honeycomb: (value, total, unit) =>
    unit ? `${value} of ${total} ${unit} filled.` : `${value} of ${total} filled.`,
};
