// TraceFold summary templates (trace-fold). Widths are durations on one linear shared time
// scale; the critical path is the decision read.
import type { SummaryStrings } from "./summary.js";

export type TraceFoldStrings = Pick<
  SummaryStrings,
  "noData" | "traceFold" | "traceFoldAt" | "traceCritical"
>;

export const EN_TRACE_FOLD: TraceFoldStrings = {
  noData: "No data.",
  traceFold: (n, total, label, duration, onCritical) =>
    onCritical
      ? `${n} spans over ${total}; longest ${label} (${duration}) on the critical path.`
      : `${n} spans over ${total}; longest ${label} (${duration}), off the critical path.`,
  traceFoldAt: (label, duration, pct, depth, criticalClause) =>
    `${label}, ${duration}, ${pct} of total, depth ${depth}${criticalClause}.`,
  traceCritical: ", on the critical path",
};
