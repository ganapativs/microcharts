// CometTrail summary templates (comet-trail) — its OWN module. A live rolling
// value; the summary states the current value and the recent trend. The trail's
// opacity encodes age only, never value, so the summary reads the head. English
// lives only in core string modules (canon). Aggregate: core/strings.ts `EN`.
import type { SummaryStrings } from "./summary.js";

export type CometTrailStrings = Pick<
  SummaryStrings,
  "noData" | "cometTrail" | "cometTrailNow" | "cometTrailAt" | "cometTrends"
>;

export const EN_COMET_TRAIL: CometTrailStrings = {
  noData: "No data.",
  cometTrail: (last, trendWord, n) => `Now ${last}, ${trendWord} over the last ${n} updates.`,
  cometTrailNow: (last) => `Now ${last}.`,
  cometTrailAt: (k, value) => `${k} updates ago: ${value}.`,
  cometTrends: ["falling", "steady", "rising"],
};
