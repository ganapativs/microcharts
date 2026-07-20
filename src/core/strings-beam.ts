// BalanceBeam summary templates (balance-beam) — its OWN module. Direction is
// the headline; magnitude reads coarsely (docs steer exact ratios elsewhere).
// English lives only in core string modules (canon). Aggregate: core/strings.ts.
import type { SummaryStrings } from "./summary.js";

export type BeamStrings = Pick<
  SummaryStrings,
  "noData" | "balanceBeam" | "balanceBeamBalanced" | "beamPanAt"
>;

export const EN_BEAM: BeamStrings = {
  // A comparison of exactly two quantities: if either pan is missing there is
  // no comparison to state, so the summary degrades to the shared empty wording
  // rather than reporting a null as zero.
  noData: "No data.",
  balanceBeam: (leftLabel, leftValue, rightLabel, rightValue, heavierLabel) =>
    `${leftLabel} ${leftValue} vs ${rightLabel} ${rightValue}; ${heavierLabel} heavier.`,
  balanceBeamBalanced: (leftLabel, leftValue, rightLabel, rightValue) =>
    `${leftLabel} ${leftValue} vs ${rightLabel} ${rightValue}; balanced.`,
  beamPanAt: (label, value) => `${label}: ${value}.`,
};
