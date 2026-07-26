// EventRaster summary templates (event-raster). One tick = one event; a lane switched to
// binned overflow mode is DISCLOSED, never silent.
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
