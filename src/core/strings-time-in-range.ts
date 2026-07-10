// TimeInRange summary templates (time-in-range) — its OWN module. Zone order is
// semantic, never sorted; the summary always leads with the in-range headline.
// English lives only in core string modules (canon). Aggregate: core/strings.ts.
import type { SummaryStrings } from "./summary.js";

export type TimeInRangeStrings = Pick<
  SummaryStrings,
  "noData" | "tirNames" | "tirClause" | "timeInRange" | "tirZone"
>;

export const EN_TIME_IN_RANGE: TimeInRangeStrings = {
  noData: "No data.",
  tirNames: ["severe low", "below", "in range", "above", "severe high"],
  tirClause: (pct, name) => `${pct} ${name}`,
  timeInRange: (list) => `${list}.`,
  tirZone: (name, pct) => `${name}: ${pct}.`,
};
