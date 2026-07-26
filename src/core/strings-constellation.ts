// Constellation summary templates (constellation). Sparse S1 events on a time axis; the
// summary names the count, the span, and the largest event, never the vertical position
// (which may be jitter — layout, not data).
import type { SummaryStrings } from "./summary.js";

export type ConstellationStrings = Pick<
  SummaryStrings,
  | "noData"
  | "constellation"
  | "constellationOne"
  | "constellationAt"
  | "constellationMagnitude"
  | "constellationEvent"
>;

export const EN_CONSTELLATION: ConstellationStrings = {
  noData: "No data.",
  constellation: (n, first, last, largest) =>
    `${n} events between ${first} and ${last}; largest at ${largest}.`,
  constellationOne: (label) => `1 event at ${label}.`,
  constellationAt: (label, value) => `${label}: ${value}.`,
  constellationMagnitude: (value) => `magnitude ${value}`,
  constellationEvent: "event",
};
