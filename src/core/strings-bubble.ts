// BubbleRow summary templates (bubble-row) — its OWN module. Area comparison is
// LOW precision; the summary names the extremes and the docs steer precise reads
// to MiniBar. English lives only in core string modules (canon). Aggregate:
// core/strings.ts `EN`.
import type { SummaryStrings } from "./summary.js";

export type BubbleStrings = Pick<
  SummaryStrings,
  "noData" | "bubbleRow" | "bubbleAt" | "bubbleEmpty"
>;

export const EN_BUBBLE: BubbleStrings = {
  noData: "No data.",
  bubbleRow: (n, maxLabel, maxValue, minLabel, minValue) =>
    `${n} items; largest ${maxLabel} at ${maxValue}, smallest ${minLabel} at ${minValue}.`,
  bubbleAt: (label, value) => `${label}: ${value}.`,
  bubbleEmpty: (label) => `${label}: no data.`,
};
