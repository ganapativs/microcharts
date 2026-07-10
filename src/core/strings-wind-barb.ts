// WindBarb summary templates (wind-barb) — its OWN module. Direction as a
// compass octant + degrees; magnitude is quantized (the honesty, stated with a
// per-barb key). English lives only in core string modules (canon).
import type { SummaryStrings } from "./summary.js";

export type WindBarbStrings = Pick<SummaryStrings, "windBarb" | "windBarbCalm" | "compass8">;

export const EN_WIND_BARB: WindBarbStrings = {
  windBarb: (compass, deg, value) => `${compass} (${deg}°), magnitude ${value}.`,
  windBarbCalm: "Calm.",
  compass8: ["North", "Northeast", "East", "Southeast", "South", "Southwest", "West", "Northwest"],
};

/** Compass octant index (0 = N, clockwise) for a bearing in degrees. */
export function octant(deg: number): number {
  const d = ((deg % 360) + 360) % 360;
  return Math.round(d / 45) % 8;
}
