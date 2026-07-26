// BiasStrip summary templates (bias-strip). A Bland–Altman agreement read: the bias (mean
// difference) plus the share of pairs inside the limits of agreement. Its SummaryStrings
// members are wired serially.
import type { SummaryStrings } from "./summary.js";

export type BiasStripStrings = Pick<
  SummaryStrings,
  "noData" | "biasStrip" | "biasStripShort" | "biasStripAt" | "biasOutside" | "biasStripLabel"
>;

export const EN_BIAS_STRIP: BiasStripStrings = {
  noData: "No data.",
  biasStrip: (bias, n, withinPct) =>
    `Bias ${bias} across ${n} pairs; ${withinPct} within the limits of agreement.`,
  biasStripShort: (bias, n) => `Bias ${bias} across ${n} pairs.`,
  biasStripAt: (pos, total, mean, diff, statusClause) =>
    `Pair ${pos} of ${total}: mean ${mean}, diff ${diff}${statusClause}.`,
  biasOutside: " — outside the limits",
  biasStripLabel: (bias) => `${bias} bias`,
};
