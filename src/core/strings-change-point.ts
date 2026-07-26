// ChangePoint summary templates (change-point)
import type { SummaryStrings } from "./summary.js";

export type ChangePointStrings = Pick<
  SummaryStrings,
  | "noData"
  | "changePoint"
  | "changePointNone"
  | "changePointAt"
  | "changePointBreak"
  | "changePointRegime"
>;

export const EN_CHANGE_POINT: ChangePointStrings = {
  noData: "No data.",
  changePoint: (dir, delta, i, before, after, tail) =>
    `Level shifted ${dir} ${delta} around point ${i} (mean ${before} → ${after}); ${
      tail === "stable" ? "stable since" : "then shifted again"
    }.`,
  changePointNone: (n) => `No clear level shift across ${n} points.`,
  changePointAt: (pos, value, regime, regimes, mean) =>
    `Point ${pos}: ${value} — regime ${regime} of ${regimes}, mean ${mean}.`,
  changePointRegime: (regime, regimes) => `regime ${regime} of ${regimes}`,
  changePointBreak: (i, before, after, signedDelta) =>
    `Break at point ${i}: mean ${before} to ${after} (${signedDelta}).`,
};
