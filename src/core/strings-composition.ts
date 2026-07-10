// Part-to-whole / staged composition templates (segmented-bar, micro-donut,
// funnel, likert-strip) — a separate MODULE (see strings-scalar.ts for the
// chunk rationale). English lives only in core string modules (canon).
import type { SummaryStrings } from "./summary.js";

export type CompositionStrings = Pick<
  SummaryStrings,
  | "noData"
  | "shareClause"
  | "shares"
  | "shareAt"
  | "shareOther"
  | "otherLabel"
  | "funnel"
  | "funnelInversion"
  | "stageAt"
  | "likert"
  | "likertLean"
  | "likertAt"
  | "allNeutral"
  | "noResponses"
>;

export const EN_COMPOSITION: CompositionStrings = {
  noData: "No data.",
  shareClause: (label, pct) => `${label} ${pct}`,
  shares: (list) => `${list}.`,
  shareAt: (label, pct, value) => `${label}: ${pct}, ${value}.`,
  shareOther: (label, pct, members) =>
    `${label}: ${pct}, ${members} ${members === 1 ? "category" : "categories"}.`,
  otherLabel: "Other",
  funnel: (stages, first, last, overallPct) =>
    `${stages} ${stages === 1 ? "stage" : "stages"}, ${first} to ${last} — overall ${overallPct}.`,
  funnelInversion: (stage, prev) => `Stage ${stage} exceeds stage ${prev}.`,
  stageAt: (label, value, retainedPct, firstLabel) =>
    `${label}: ${value} — ${retainedPct} of ${firstLabel}.`,
  likert: (agree, disagree, neutral) =>
    neutral === null
      ? `${agree} agree, ${disagree} disagree.`
      : `${agree} agree, ${disagree} disagree, ${neutral} neutral.`,
  likertLean: (dir) => (dir === "balanced" ? "Balanced." : `Leans ${dir}.`),
  likertAt: (label, pct, level, total) => `${label}: ${pct}, level ${level} of ${total}.`,
  allNeutral: "All responses neutral.",
  noResponses: "No responses.",
};
