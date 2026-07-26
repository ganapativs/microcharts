// ActivityGrid summary templates (activity-grid)
import type { SummaryStrings } from "./summary.js";

export type ActivityStrings = Pick<
  SummaryStrings,
  "noActivity" | "activityGrid" | "dayAt" | "dayEmpty"
>;

export const EN_ACTIVITY: ActivityStrings = {
  noActivity: "No activity.",
  activityGrid: (total, count, busiest) =>
    `Total ${total} over ${count} ${count === 1 ? "period" : "periods"}. Busiest ${busiest}.`,
  // Shared with CalendarStrip: when `anchor` dates the grid, a cell is a DAY,
  // and "point 34 of 90" is a worse answer than the date the reader is pointing
  // at. Undated grids keep the positional announcement.
  dayAt: (dateLabel, value) => `${dateLabel}: ${value}.`,
  dayEmpty: (dateLabel) => `${dateLabel}: no data.`,
};
