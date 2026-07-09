// ParetoStrip summary templates (pareto-strip) — its OWN module (see
// strings-scalar.ts for the chunk rationale). English lives only in core string
// modules (canon). Aggregate: core/strings.ts `EN`.
import type { SummaryStrings } from "./summary.js";

export type ParetoStrings = Pick<
  SummaryStrings,
  "noData" | "pareto" | "paretoTop" | "paretoEmpty" | "paretoAt"
>;

export const EN_PARETO: ParetoStrings = {
  noData: "No data.",
  pareto: (k, n, unit, cumPct, metric) =>
    `Top ${k} of ${n} ${unit} account for ${cumPct} of ${metric}.`,
  paretoTop: (topLabel, topPct) => `${topLabel} leads at ${topPct}.`,
  paretoEmpty: (metric) => `No recorded ${metric}.`,
  paretoAt: (label, sharePct, cumPct) => `${label}: ${sharePct} of total, cumulative ${cumPct}.`,
};
