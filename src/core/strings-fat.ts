// FatDigits summary templates (fat-digits) — its OWN module. The numeral is
// always the exact value; the tier is the redundant ordinal weight channel.
// In digit mode there is no single tier (each digit carries its own), so the
// summary is just the number. English lives only here (canon). Aggregate:
// core/strings.ts `EN`.
import type { SummaryStrings } from "./summary.js";

export type FatStrings = Pick<SummaryStrings, "noData" | "fatDigits" | "fatDigitsPlain">;

export const EN_FAT: FatStrings = {
  noData: "No data.",
  fatDigits: (value, tier, tiers) => `${value} — tier ${tier} of ${tiers}.`,
  fatDigitsPlain: (value) => `${value}.`,
};
