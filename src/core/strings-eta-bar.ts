// EtaBar summary templates (eta-bar) — its OWN module. The remainder is sized by
// the OBSERVED rate, never linear interpolation, so the summary always hedges
// with "at the current rate". English lives only in core string modules (canon).
import type { SummaryStrings } from "./summary.js";

export type EtaBarStrings = Pick<
  SummaryStrings,
  "noData" | "etaBar" | "etaBarStalled" | "etaBarDone"
>;

export const EN_ETA_BAR: EtaBarStrings = {
  noData: "No data.",
  etaBar: (pct, remaining) => `${pct} done; about ${remaining} remaining at the current rate.`,
  etaBarStalled: (pct) => `${pct} done; stalled.`,
  etaBarDone: "Done.",
};
