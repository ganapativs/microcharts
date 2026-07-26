// PolarClock summary templates (polar-clock). A cyclic S1 series (24 hours, 7 days, any n)
// read as radial bars around a clock face; the summary names the peak and the quiet point
// of the cycle. Segment labels come from a `segmentFormat` option (hour formatting for
// n=24, these weekday names for n=7).
import type { SummaryStrings } from "./summary.js";

export type PolarClockStrings = Pick<
  SummaryStrings,
  "noData" | "polarClock" | "polarClockFlat" | "polarClockAt" | "weekdays"
>;

export const EN_POLAR_CLOCK: PolarClockStrings = {
  noData: "No data.",
  polarClock: (peakLabel, max, minLabel) => `Peaks at ${peakLabel} (${max}); quietest ${minLabel}.`,
  polarClockFlat: (value) => `Flat at ${value} across the cycle.`,
  polarClockAt: (label, value) => `${label}: ${value}.`,
  weekdays: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
};
