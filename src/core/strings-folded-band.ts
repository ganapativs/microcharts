// FoldedDayBand summary templates (folded-day-band) — its OWN module. Envelopes
// come from real per-bin quantiles; the number of folded periods backs the claim
// and is disclosed when thin. English lives only in core string modules (canon).
import type { SummaryStrings } from "./summary.js";

export type FoldedBandStrings = Pick<
  SummaryStrings,
  "noData" | "foldedBand" | "foldedToday" | "foldedAt"
>;

export const EN_FOLDED_BAND: FoldedBandStrings = {
  noData: "No data.",
  foldedBand: (pos, value, todayClause) => `Median peaks at ${pos} (${value})${todayClause}.`,
  foldedToday: [
    "; today is below the 25th percentile",
    "; today is typical",
    "; today is above the 75th percentile",
  ],
  foldedAt: (pos, m, q1, q3, todayClause) =>
    `at ${pos}: median ${m}, middle half ${q1}–${q3}${todayClause}.`,
};
