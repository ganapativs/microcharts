// BreathingDot summary templates (breathing-dot). An ambient load level; the summary states
// the percent and the band word (calm / elevated / strained). Motion (pulse rate) and the
// static ring offset both double the band color, so the words here are never the only
// signal.
import type { SummaryStrings } from "./summary.js";

export type BreathingDotStrings = Pick<
  SummaryStrings,
  "breathingDot" | "breathingDotUnknown" | "loadBands"
>;

export const EN_BREATHING_DOT: BreathingDotStrings = {
  breathingDot: (pct, bandWord) => `Load ${pct} — ${bandWord}.`,
  breathingDotUnknown: "Load unknown.",
  loadBands: ["calm", "elevated", "strained"],
};
