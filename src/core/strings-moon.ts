// MoonPhase summary templates (moon-phase). Progress mode reads as completion; cycle mode
// as position through a period.
import type { SummaryStrings } from "./summary.js";

export type MoonStrings = Pick<SummaryStrings, "moonPhase" | "moonPhaseCycle">;

export const EN_MOON: MoonStrings = {
  moonPhase: (pct) => `${pct} of the cycle complete.`,
  moonPhaseCycle: (pct) => `${pct} through the cycle.`,
};
