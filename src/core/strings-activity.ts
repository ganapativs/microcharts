// ActivityGrid summary templates (activity-grid) — its OWN module. English lives
// only in core string modules (canon). Aggregate: core/strings.ts `EN`.
import type { SummaryStrings } from "./summary.js";

export type ActivityStrings = Pick<SummaryStrings, "noActivity" | "activityGrid">;

export const EN_ACTIVITY: ActivityStrings = {
  noActivity: "No activity.",
  activityGrid: (total, count, busiest) =>
    `Total ${total} over ${count} ${count === 1 ? "period" : "periods"}. Busiest ${busiest}.`,
};
