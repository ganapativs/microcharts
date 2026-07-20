// CitySkyline summary templates (city-skyline) — its OWN module. Height is the
// headline; the lit fraction is a secondary low-precision channel. English lives
// only in core string modules (canon). Aggregate: core/strings.ts `EN`.
import type { SummaryStrings } from "./summary.js";

export type SkylineStrings = Pick<
  SummaryStrings,
  "noData" | "citySkyline" | "citySkylineAt" | "citySkylineAtLit" | "citySkylineEmpty"
>;

export const EN_SKYLINE: SkylineStrings = {
  noData: "No data.",
  citySkyline: (n, unit, tallLabel, tallValue) =>
    `${n} ${unit}; tallest ${tallLabel} at ${tallValue}.`,
  citySkylineAt: (label, value) => `${label}: ${value}.`,
  citySkylineAtLit: (label, value, litPct) => `${label}: ${value}; ${litPct} lit.`,
  citySkylineEmpty: (label) => `${label}: no data.`,
};
