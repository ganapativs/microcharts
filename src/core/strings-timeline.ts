// Event-timeline summary templates
import type { SummaryStrings } from "./summary.js";

export type TimelineStrings = Pick<
  SummaryStrings,
  "noData" | "spanAt" | "eventAt" | "timeline" | "timelineFallback"
>;

export const EN_TIMELINE: TimelineStrings = {
  noData: "No data.",
  timelineFallback: (index, kind) => (kind === "span" ? `Span ${index}` : `Event ${index}`),
  spanAt: (label, startLabel, endLabel, duration) =>
    `${label}: ${startLabel} to ${endLabel} — ${duration}.`,
  eventAt: (label, atLabel) => `${label}: ${atLabel}.`,
  timeline: (spans, events, coveragePct) =>
    `${spans} ${spans === 1 ? "span" : "spans"} covering ${coveragePct} of the window; ${events} ${events === 1 ? "event" : "events"}.`,
};
