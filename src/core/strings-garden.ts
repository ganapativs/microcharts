// GardenGrid summary templates (garden-grid) — its OWN module. Ordinal steps,
// not values (docs steer exact reads to ActivityGrid/HeatStrip). English lives
// only in core string modules (canon). Aggregate: core/strings.ts `EN`.
import type { SummaryStrings } from "./summary.js";

export type GardenStrings = Pick<SummaryStrings, "noData" | "gardenGrid" | "gardenCell">;

export const EN_GARDEN: GardenStrings = {
  noData: "No data.",
  gardenGrid: (n, unit, peak, active) => `${n} ${unit}; peak ${peak}, ${active} active.`,
  gardenCell: (pos, total, value, k, steps) =>
    `${pos} of ${total}: ${value}, step ${k} of ${steps}.`,
};
