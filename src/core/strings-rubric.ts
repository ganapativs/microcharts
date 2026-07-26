// RubricStrip summary templates (rubric-strip). The summary names EXTREMES, never a
// weighted total: the type exists to resist collapsing quality into one number.
import type { SummaryStrings } from "./summary.js";

export type RubricStrings = Pick<
  SummaryStrings,
  "noData" | "rubric" | "rubricRow" | "rubricRowEmpty"
>;

export const EN_RUBRIC: RubricStrings = {
  noData: "No data.",
  rubric: (n, hi, hiScore, lo, loScore) =>
    `${n} criteria; highest ${hi} (${hiScore}), lowest ${lo} (${loScore}).`,
  rubricRow: (label, score, weightPct) => `${label}: ${score}, weight ${weightPct} of total.`,
  rubricRowEmpty: (label, weightPct) => `${label}: no score, weight ${weightPct} of total.`,
};
