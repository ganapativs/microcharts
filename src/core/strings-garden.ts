// GardenGrid summary templates (garden-grid). Ordinal steps, not values (docs steer exact
// reads to ActivityGrid/HeatStrip).
import type { SummaryStrings } from "./summary.js";

export type GardenStrings = Pick<SummaryStrings, "noData" | "gardenGrid" | "gardenCell"> & {
  /** Interactive-entry announcement for a null (missing, not zero) cell —
   *  not in the shared SummaryStrings union (GardenGrid-only phrasing). */
  gardenCellEmpty: (pos: number, total: number) => string;
};

export const EN_GARDEN: GardenStrings = {
  noData: "No data.",
  gardenGrid: (n, unit, peak, active) => `${n} ${unit}; peak ${peak}, ${active} active.`,
  gardenCell: (pos, total, value, k, steps) =>
    `${pos} of ${total}: ${value}, step ${k} of ${steps}.`,
  gardenCellEmpty: (pos, total) => `${pos} of ${total}: no data.`,
};
