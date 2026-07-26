// Hourglass summary templates (hourglass). Both sides of the story: elapsed and remaining.
import type { SummaryStrings } from "./summary.js";

export type HourglassStrings = Pick<SummaryStrings, "hourglass">;

export const EN_HOURGLASS: HourglassStrings = {
  hourglass: (elapsed, remaining) => `${elapsed} elapsed, ${remaining} remaining.`,
};
