// Event-timeline summary templates — a separate MODULE (see strings-scalar.ts
// for the chunk rationale).
import type { SummaryStrings } from "./summary.js";

export type TimelineStrings = Pick<SummaryStrings, "noData" | "spanAt" | "eventAt" | "timeline">;

export const EN_TIMELINE: TimelineStrings = {
  noData: "No data.",
  spanAt: (label, startLabel, endLabel, duration) =>
    `${label}: ${startLabel} to ${endLabel} — ${duration}.`,
  eventAt: (label, atLabel) => `${label}: ${atLabel}.`,
  timeline: (spans, events, coveragePct) =>
    `${spans} ${spans === 1 ? "span" : "spans"} covering ${coveragePct} of the window; ${events} ${events === 1 ? "event" : "events"}.`,
};
