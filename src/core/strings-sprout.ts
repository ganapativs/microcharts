// SproutRow summary templates (sprout-row) — its OWN module. Four ordinal stage
// names carry the i18n contract for the growth metaphor. English lives only in
// core string modules (canon). Aggregate: core/strings.ts `EN`.
import type { SummaryStrings } from "./summary.js";

export type SproutStrings = Pick<
  SummaryStrings,
  "sproutRow" | "sproutStage" | "sproutStageNames" | "sproutEmpty"
>;

export const EN_SPROUT: SproutStrings = {
  sproutStageNames: ["seed", "sprout", "leaf", "bloom"],
  sproutRow: (n, bloom, seed) => `${n} items; ${bloom} at bloom, ${seed} at seed.`,
  sproutStage: (label, stageName, k) => `${label}: ${stageName}, stage ${k} of 4.`,
  sproutEmpty: (label) => `${label}: no data.`,
};
