// Paired / referenced S2 summary templates (dumbbell, slope, paired-bars)
import type { SummaryStrings } from "./summary.js";

export type PairedStrings = Pick<
  SummaryStrings,
  | "noData"
  | "dirNames"
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

/**
 * `pairChange` cannot compute a percent from a zero baseline, so it hands these
 * templates an EMPTY `pct` — and every one of them concatenated it unguarded.
 * A Dumbbell of `{ from: 0, to: 5 }` announced "From 0 to 5, up ." and a
 * multi-row one "2 rows. Largest change Berlin, up ." The direction is still
 * true and still worth saying; only the ratio is undefined, so the ratio is
 * what drops. Every `pct` slot below is optional for this reason.
 */
const withPct = (direction: string, pct: string): string =>
  pct ? `${direction} ${pct}` : direction;

export const EN_PAIRED: PairedStrings = {
  noData: "No data.",
  dirNames: ["up", "down"],
  fromTo: (from, to, direction, pct) => `From ${from} to ${to}, ${withPct(direction, pct)}.`,
  flatPair: (value) => `No change at ${value}.`,
  rows: (count, topLabel, topDirection, topPct) =>
    `${count} rows. Largest change ${topLabel}, ${withPct(topDirection, topPct)}.`,
  pairAt: (label, value, ref) => `${label}: ${value} vs ${ref}.`,
  pairAtNoRef: (label, value) => `${label}: ${value}, no reference.`,
  pairAtEmpty: (label) => `${label}: no data.`,
  pairs: (count, gapLabel, value, ref) =>
    `${count} ${count === 1 ? "pair" : "pairs"}. Largest gap ${gapLabel}: ${value} vs ${ref}.`,
  slopeAt: (label, from, to, direction, pct) =>
    `${label}: ${from} to ${to}, ${withPct(direction, pct)}.`,
  slopes: (count, up, down, topLabel, topDirection, topPct) =>
    `${count} categories: ${up} up, ${down} down. Largest change ${topLabel}, ${withPct(topDirection, topPct)}.`,
  slopeIncomplete: (label, value) => `${label}: ${value}, incomplete.`,
};
