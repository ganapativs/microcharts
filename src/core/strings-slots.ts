// Slot-announcement templates for charts whose series can have EMPTY slots (activity-grid,
// heat-strip, seismogram interactive entries). A separate MODULE so the sparkline-class
// series chunk never grows with slot wording Aggregate: strings.ts `EN`.
import type { SummaryStrings } from "./summary.js";

export type SlotStrings = Pick<SummaryStrings, "pointEmpty">;

export const EN_SLOTS: SlotStrings = {
  pointEmpty: (pos, total) => `Point ${pos} of ${total}: no data.`,
};
