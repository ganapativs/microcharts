// BalanceBeam summary templates (balance-beam) — its OWN module. Direction is
// the headline; magnitude reads coarsely (docs steer exact ratios elsewhere).
// English lives only in core string modules (canon). Aggregate: core/strings.ts.
import type { SummaryStrings } from "./summary.js";

export type BeamStrings = Pick<SummaryStrings, "balanceBeam" | "balanceBeamBalanced">;

export const EN_BEAM: BeamStrings = {
  balanceBeam: (leftLabel, leftValue, rightLabel, rightValue, heavierLabel) =>
    `${leftLabel} ${leftValue} vs ${rightLabel} ${rightValue}; ${heavierLabel} heavier.`,
  balanceBeamBalanced: (leftLabel, leftValue, rightLabel, rightValue) =>
    `${leftLabel} ${leftValue} vs ${rightLabel} ${rightValue}; balanced.`,
};
