// Hourglass summary templates (hourglass) — its OWN module. Both sides of the
// story: elapsed and remaining. English lives only in core string modules
// (canon). Aggregate: core/strings.ts `EN`.
import type { SummaryStrings } from "./summary.js";

export type HourglassStrings = Pick<SummaryStrings, "hourglass">;

export const EN_HOURGLASS: HourglassStrings = {
  hourglass: (elapsed, remaining) => `${elapsed} elapsed, ${remaining} remaining.`,
};
