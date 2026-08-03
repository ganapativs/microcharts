// WindBarb summary templates (wind-barb). Direction as a compass octant + degrees;
// magnitude is quantized (the honesty, stated with a per-barb key).
import type { SummaryStrings } from "./summary.js";

export type WindBarbStrings = Pick<
  SummaryStrings,
  "windBarb" | "windBarbChip" | "windBarbCalm" | "compass8"
>;

export const EN_WIND_BARB: WindBarbStrings = {
  // `compass8` is canonically lowercase (shared key, used sentence-medially by
  // station-glyph); this template opens a sentence so it capitalizes the first
  // character itself — each locale owns its own casing.
  windBarb: (compass, deg, value) =>
    `${compass.charAt(0).toUpperCase() + compass.slice(1)} (${deg}°), magnitude ${value}.`,
  // The hover chip is a tooltip, not a sentence — lowercase octant, no period.
  windBarbChip: (compass, deg, value) => `${compass} ${deg}° · ${value}`,
  windBarbCalm: "Calm.",
  compass8: ["north", "northeast", "east", "southeast", "south", "southwest", "west", "northwest"],
};

/** Compass octant index (0 = N, clockwise) for a bearing in degrees. */
export function octant(deg: number): number {
  const d = ((deg % 360) + 360) % 360;
  return Math.round(d / 45) % 8;
}
