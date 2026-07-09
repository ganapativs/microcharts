// SpiralYear summary templates (spiral-year) — its OWN module. A calendar series
// wound onto a spiral; the summary names the count, the peak, and the low. Opacity
// is a LOW-precision ordinal channel, so this is a pattern instrument and the docs
// steer point reads to ActivityGrid/HeatStrip. English lives only in core string
// modules (canon). Aggregate: core/strings.ts `EN`.
import type { SummaryStrings } from "./summary.js";

export type SpiralYearStrings = Pick<SummaryStrings, "noData" | "spiralYear" | "spiralYearAt">;

export const EN_SPIRAL_YEAR: SpiralYearStrings = {
  noData: "No data.",
  spiralYear: (n, cadence, max, peakLabel, minLabel) =>
    `${n} ${cadence === "week" ? "weeks" : "days"}; peak ${max} in ${peakLabel}, low in ${minLabel}.`,
  spiralYearAt: (label, value) => `${label}: ${value}.`,
};
