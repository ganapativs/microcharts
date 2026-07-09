// Thermometer summary templates (thermometer) — its OWN module. States the
// value against the calibrated scale, and the goal when a target is set. English
// lives only in core string modules (canon). Aggregate: core/strings.ts `EN`.
import type { SummaryStrings } from "./summary.js";

export type ThermometerStrings = Pick<
  SummaryStrings,
  "noData" | "thermometer" | "thermometerTarget"
>;

export const EN_THERMOMETER: ThermometerStrings = {
  noData: "No data.",
  thermometer: (value, min, max) => `${value} on a ${min}–${max} scale.`,
  thermometerTarget: (value, min, max, target) =>
    `${value} on a ${min}–${max} scale; target ${target}.`,
};
