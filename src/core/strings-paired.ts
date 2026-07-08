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
  | "pairs"
  | "slopeAt"
  | "slopes"
  | "slopeIncomplete"
>;

const dir = (d: "up" | "down") => (d === "up" ? "up" : "down");

export const EN_PAIRED: PairedStrings = {
  noData: "No data.",
  fromTo: (from, to, direction, pct) => `From ${from} to ${to}, ${dir(direction)} ${pct}.`,
  flatPair: (value) => `No change at ${value}.`,
  rows: (count, topLabel, topDirection, topPct) =>
    `${count} rows. Largest change ${topLabel}, ${dir(topDirection)} ${topPct}.`,
  pairAt: (label, value, ref) => `${label}: ${value} vs ${ref}.`,
  pairs: (count, gapLabel, value, ref) =>
    `${count} ${count === 1 ? "pair" : "pairs"}. Largest gap ${gapLabel}: ${value} vs ${ref}.`,
  slopeAt: (label, from, to, direction, pct) =>
    `${label}: ${from} to ${to}, ${dir(direction)} ${pct}.`,
  slopes: (count, up, down, topLabel, topDirection, topPct) =>
    `${count} categories: ${up} up, ${down} down. Largest change ${topLabel}, ${dir(topDirection)} ${topPct}.`,
  slopeIncomplete: (label, value) => `${label}: ${value}, incomplete.`,
};
