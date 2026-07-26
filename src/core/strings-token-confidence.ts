// TokenConfidence summary templates (token-confidence). Three discrete tiers, never a
// gradient: people calibrate categorically.
import type { SummaryStrings } from "./summary.js";

export type TokenConfidenceStrings = Pick<
  SummaryStrings,
  | "noTokens"
  | "tokenConfidence"
  | "tokenTierNames"
  | "tokenAt"
  | "tokenChip"
  | "tokenConfidenceLabel"
>;

export const EN_TOKEN_CONFIDENCE: TokenConfidenceStrings = {
  noTokens: "No tokens.",
  tokenConfidence: (n, confident, unsure, guessing) =>
    `${n} tokens: ${confident} confident, ${unsure} unsure, ${guessing} guessing.`,
  tokenTierNames: ["confident", "unsure", "guessing"],
  tokenAt: (token, tier, confidence) => `${token}: ${tier}, ${confidence}.`,
  tokenChip: (tier, confidence) => `${tier} ${confidence}`,
  tokenConfidenceLabel: "Token confidence",
};
