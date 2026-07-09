// RetentionCurve summary templates (retention-curve) — a separate MODULE (see
// strings-scalar.ts for the chunk rationale). English lives only in core string
// modules (canon). Aggregate: core/strings.ts `EN`.
import type { SummaryStrings } from "./summary.js";

export type RetentionStrings = Pick<
  SummaryStrings,
  "noData" | "retention" | "retentionNoPlateau" | "retentionAt"
>;

export const EN_RETENTION: RetentionStrings = {
  noData: "No data.",
  retention: (last, n, unit, from) =>
    `${last} retained after ${n} ${unit}s; curve plateaus from ${unit} ${from}.`,
  retentionNoPlateau: (last, n, unit) => `${last} retained after ${n} ${unit}s.`,
  retentionAt: (unit, period, value, benchmark) =>
    `${unit} ${period}: ${value} retained${benchmark !== null ? ` (benchmark ${benchmark})` : ""}.`,
};
