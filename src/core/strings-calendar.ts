// Calendar-day summary templates
import type { SummaryStrings } from "./summary.js";

export type CalendarStrings = Pick<SummaryStrings, "noData" | "dayAt" | "dayEmpty" | "calendar">;

export const EN_CALENDAR: CalendarStrings = {
  noData: "No data.",
  dayAt: (dateLabel, value) => `${dateLabel}: ${value}.`,
  dayEmpty: (dateLabel) => `${dateLabel}: no data.`,
  calendar: (activeDays, totalDays, weeks) =>
    `Active ${activeDays} of ${totalDays} days over ${weeks} ${weeks === 1 ? "week" : "weeks"}.`,
};
