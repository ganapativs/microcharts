// Quantile-family summary templates (benchmark-strip, percentile-ladder,
// graded-band) — a separate MODULE (see strings-scalar.ts for why). These
// charts derive nested intervals / percentiles from a sample, so they share one
// phrasing family. English lives only in core string modules (canon).
// Aggregate dictionary: core/strings.ts `EN`.
import type { SummaryStrings } from "./summary.js";

/** English ordinal ("68th"). Shared by the percentile phrasing. Duplicated in
 *  strings-category/strings-dist by design — each string module is its own
 *  chunk, so sharing a helper would tax every consumer's bundle. */
const ordinal = (n: number): string => {
  const rem10 = n % 10;
  const rem100 = n % 100;
  if (rem10 === 1 && rem100 !== 11) return `${n}st`;
  if (rem10 === 2 && rem100 !== 12) return `${n}nd`;
  if (rem10 === 3 && rem100 !== 13) return `${n}rd`;
  return `${n}th`;
};

export type QuantileStrings = Pick<
  SummaryStrings,
  | "noData"
  | "benchmark"
  | "benchmarkFlat"
  | "benchmarkEdge"
  | "ladder"
  | "ladderTick"
  | "ladderProbe"
  | "ladderFlat"
  | "gradedBand"
  | "bandClause"
  | "bandEdge"
  | "bandPoint"
>;

export const EN_QUANTILE: QuantileStrings = {
  noData: "No data.",
  benchmark: (value, percentile, n, p25, p75) =>
    `${value} — ${ordinal(percentile)} percentile of ${n} peers (middle half ${p25}–${p75}).`,
  benchmarkFlat: (value, n, peerValue) => `${value} — all ${n} peers at ${peerValue}.`,
  benchmarkEdge: (name, value) => `${name}: ${value}.`,
  ladder: (list, tailShare, ratio) =>
    `${list} — the slowest ${tailShare} take ${ratio} the median.`,
  ladderTick: (p, value) => `p${p} ${value}`,
  ladderProbe: (p, value, ratio) => `p${p}: ${value} — ${ratio} the median.`,
  ladderFlat: (value) => `All percentiles equal at ${value}.`,
  gradedBand: (median, clauses) => `Median ${median}; ${clauses}.`,
  bandClause: (level, lo, hi) => `${level}% within ${lo}–${hi}`,
  bandEdge: (level, lo, hi) => `${level}% interval: ${lo} to ${hi}.`,
  bandPoint: (value) => `Point value ${value}, no interval.`,
};
