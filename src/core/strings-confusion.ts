// ConfusionGrid summary templates (confusion-grid). Row- normalization is stated in the
// phrasing ("% of cats") so the denominator travels with every number.
import type { SummaryStrings } from "./summary.js";

export type ConfusionStrings = Pick<
  SummaryStrings,
  "noData" | "confusion" | "confusionPerfect" | "confusionAt" | "confusionEmpty"
>;

export const EN_CONFUSION: ConfusionStrings = {
  noData: "No data.",
  confusion: (acc, actual, predicted, pct) =>
    `Accuracy ${acc}. Most confused: ${actual} predicted as ${predicted} (${pct} of ${actual}s).`,
  confusionPerfect: (acc) => `Accuracy ${acc}. No confusion.`,
  confusionAt: (actual, predicted, pct, count) =>
    `Actual ${actual}, predicted ${predicted}: ${pct} of ${actual}s (${count}).`,
  confusionEmpty: (cls) => `no ${cls} samples`,
};
