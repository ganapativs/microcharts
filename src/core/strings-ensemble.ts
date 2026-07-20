// EnsembleGhosts summary templates (ensemble-ghosts) — its OWN module (see
// strings-scalar.ts for the chunk rationale). English lives only in core string
// modules (canon). Aggregate: core/strings.ts `EN`.
import type { SummaryStrings } from "./summary.js";

export type EnsembleStrings = Pick<
  SummaryStrings,
  "noData" | "ensemble" | "ensembleSingle" | "ensembleAt" | "ensembleEmpty"
>;

export const EN_ENSEMBLE: EnsembleStrings = {
  noData: "No data.",
  ensemble: (n, lo, hi, mid) =>
    `${n} simulated paths end between ${lo} and ${hi}; typical path ends near ${mid}.`,
  ensembleSingle: (end) => `Single path, ends at ${end}.`,
  ensembleAt: (pos, total, end) => `Member ${pos} of ${total}; ends at ${end}.`,
  ensembleEmpty: (pos, total) => `Member ${pos} of ${total}; no data.`,
};
