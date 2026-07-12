// QuantileDots summary templates (quantile-dots) — its OWN module (NOT shared
// with strings-freq/icon-array: a shared chunk taxes every consumer, and
// icon-array sat at its size budget). Frequency framing ("N in count") reads
// truer than a bare percentage. English lives only in core
// string modules (canon). Aggregate: core/strings.ts `EN`.
import type { SummaryStrings } from "./summary.js";

export type QuantileDotsStrings = Pick<
  SummaryStrings,
  "noData" | "quantileDots" | "quantileDotsRange"
>;

export const EN_QUANTILE_DOTS: QuantileDotsStrings = {
  noData: "No data.",
  quantileDots: (past, count, side, threshold) =>
    `${past} in ${count} chances ${side} ${threshold}.`,
  quantileDotsRange: (modeLo, modeHi, min, max) =>
    `Most likely ${modeLo}–${modeHi}; range ${min} to ${max}.`,
};
