// TokenConfidence summary templates (token-confidence) — its OWN module. Three
// discrete tiers, never a gradient: people calibrate categorically. English
// lives only in core string modules (canon). Aggregate: core/strings.ts.
import type { SummaryStrings } from "./summary.js";

export type TokenConfidenceStrings = Pick<
  SummaryStrings,
  "noTokens" | "tokenConfidence" | "tokenTierNames" | "tokenAt"
>;

export const EN_TOKEN_CONFIDENCE: TokenConfidenceStrings = {
  noTokens: "No tokens.",
  tokenConfidence: (n, confident, unsure, guessing) =>
    `${n} tokens: ${confident} confident, ${unsure} unsure, ${guessing} guessing.`,
  tokenTierNames: ["confident", "unsure", "guessing"],
  tokenAt: (token, tier, confidence) => `${token}: ${tier}, ${confidence}.`,
};
