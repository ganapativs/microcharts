// DualWindowMeter summary templates (dual-window-meter). Two integration windows vs a
// compliance target; the window sizes are part of the meaning.
import type { SummaryStrings } from "./summary.js";

export type DualWindowStrings = Pick<SummaryStrings, "noData" | "dualWindow" | "dualWindowAt">;

export const EN_DUAL_WINDOW: DualWindowStrings = {
  noData: "No data.",
  dualWindow: (slow, target, fast) => `Slow window ${slow} vs target ${target}; fast ${fast}.`,
  dualWindowAt: (fast, slow, target) => `fast ${fast}, slow ${slow}, target ${target}.`,
};
