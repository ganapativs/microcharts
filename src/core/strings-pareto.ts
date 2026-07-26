// ParetoStrip summary templates (pareto-strip)
import type { SummaryStrings } from "./summary.js";

export type ParetoStrings = Pick<
  SummaryStrings,
  "noData" | "pareto" | "paretoTop" | "paretoEmpty" | "paretoAt" | "paretoCount"
>;

export const EN_PARETO: ParetoStrings = {
  noData: "No data.",
  pareto: (k, n, unit, cumPct, metric) =>
    `Top ${k} of ${n} ${unit} account for ${cumPct} of ${metric}.`,
  paretoTop: (topLabel, topPct) => `${topLabel} leads at ${topPct}.`,
  paretoEmpty: (metric) => `No recorded ${metric}.`,
  paretoAt: (label, sharePct, cumPct) => `${label}: ${sharePct} of total, cumulative ${cumPct}.`,
  paretoCount: (k, n, cumPct) => `${k} of ${n} → ${cumPct}`,
};
