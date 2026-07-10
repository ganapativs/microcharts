// EventRaster summary templates (event-raster) — its OWN module. One tick = one
// event; a lane switched to binned overflow mode is DISCLOSED, never silent.
// English lives only in core string modules (canon). Aggregate: core/strings.ts.
import type { SummaryStrings } from "./summary.js";

export type EventRasterStrings = Pick<
  SummaryStrings,
  "noData" | "eventRaster" | "eventRasterBinned" | "eventRasterAt"
>;

export const EN_EVENT_RASTER: EventRasterStrings = {
  noData: "No data.",
  eventRaster: (lanes, events, lane, count) =>
    `${lanes} lanes, ${events} events; busiest ${lane} (${count}).`,
  eventRasterBinned: (lanes) => ` ${lanes} shown binned.`,
  eventRasterAt: (lane, t, k, n) => `${lane}, event at ${t} (${k} of ${n}).`,
};
