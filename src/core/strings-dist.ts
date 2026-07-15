// Distribution / event summary templates (rug-strip, seismogram, histogram,
// micro-box…) — a separate MODULE (see strings-scalar.ts for why). English
// lives only in core string modules (canon). Aggregate: core/strings.ts `EN`.
import type { SummaryStrings } from "./summary.js";

// Duplicated in strings-category/strings-quantile by design — each string module
// is its own chunk, so sharing a helper would tax every consumer's bundle.
const ordinal = (n: number): string => {
  const rem10 = n % 10;
  const rem100 = n % 100;
  if (rem10 === 1 && rem100 !== 11) return `${n}st`;
  if (rem10 === 2 && rem100 !== 12) return `${n}nd`;
  if (rem10 === 3 && rem100 !== 13) return `${n}rd`;
  return `${n}th`;
};

export type DistStrings = Pick<
  SummaryStrings,
  | "noData"
  | "observations"
  | "observation"
  | "events"
  | "noEvents"
  | "binAt"
  | "distribution"
  | "fiveNum"
  | "boxStat"
>;

export const EN_DIST: DistStrings = {
  noData: "No data.",
  observations: (count, min, max, median) =>
    `${count} values from ${min} to ${max}, median ${median}.`,
  observation: (value, rank, count) => `${value} — ${ordinal(rank)} of ${count}.`,
  events: (count, peak) => `${count} events, peak ${peak}.`,
  noEvents: "No events.",
  binAt: (lo, hi, count) => `${lo} to ${hi}: ${count} ${count === 1 ? "value" : "values"}.`,
  distribution: (count, lo, hi) => `${count} values, most between ${lo} and ${hi}.`,
  fiveNum: (median, q1, q3, min, max) =>
    `Median ${median}, middle half ${q1} to ${q3}, range ${min} to ${max}.`,
  boxStat: (which, value) => {
    const name = { min: "Min", q1: "Q1", median: "Median", q3: "Q3", max: "Max" }[which];
    return `${name}: ${value}.`;
  },
};
