// Paired / referenced S2 summary templates (dumbbell, slope, paired-bars) — a
// separate MODULE (see strings-scalar.ts for the chunk rationale). English
// lives only in core string modules (canon). Aggregate: core/strings.ts `EN`.
import type { SummaryStrings } from "./summary.js";

export type PairedStrings = Pick<
  SummaryStrings,
  | "noData"
  | "fromTo"
  | "flatPair"
  | "rows"
  | "pairAt"
  | "pairAtNoRef"
  | "pairAtEmpty"
  | "pairs"
  | "slopeAt"
  | "slopes"
  | "slopeIncomplete"
>;

export const EN_PAIRED: PairedStrings = {
  noData: "No data.",
  fromTo: (from, to, direction, pct) => `From ${from} to ${to}, ${direction} ${pct}.`,
  flatPair: (value) => `No change at ${value}.`,
  rows: (count, topLabel, topDirection, topPct) =>
    `${count} rows. Largest change ${topLabel}, ${topDirection} ${topPct}.`,
  pairAt: (label, value, ref) => `${label}: ${value} vs ${ref}.`,
  pairAtNoRef: (label, value) => `${label}: ${value}, no reference.`,
  pairAtEmpty: (label) => `${label}: no data.`,
  pairs: (count, gapLabel, value, ref) =>
    `${count} ${count === 1 ? "pair" : "pairs"}. Largest gap ${gapLabel}: ${value} vs ${ref}.`,
  slopeAt: (label, from, to, direction, pct) => `${label}: ${from} to ${to}, ${direction} ${pct}.`,
  slopes: (count, up, down, topLabel, topDirection, topPct) =>
    `${count} categories: ${up} up, ${down} down. Largest change ${topLabel}, ${topDirection} ${topPct}.`,
  slopeIncomplete: (label, value) => `${label}: ${value}, incomplete.`,
};
