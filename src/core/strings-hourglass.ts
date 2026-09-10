// Hourglass summary templates (hourglass). Both sides of the story: elapsed and remaining.
import type { SummaryStrings } from "./summary.js";

export type HourglassStrings = Pick<SummaryStrings, "hourglass" | "noData">;

export const EN_HOURGLASS: HourglassStrings = {
  noData: "No data.",
  hourglass: (elapsed, remaining) => `${elapsed} elapsed, ${remaining} remaining.`,
};
