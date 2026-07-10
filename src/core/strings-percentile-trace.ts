// PercentileTrace summary templates (percentile-trace) — its OWN module (see
// strings-scalar.ts for the chunk rationale). The series is a percentile rank,
// so "p81" is locale-neutral positional notation; the number inside is still
// formatted. English lives only in core string modules (canon). Aggregate:
// core/strings.ts `EN`.
import type { SummaryStrings } from "./summary.js";

export type PercentileTraceStrings = Pick<
  SummaryStrings,
  | "noData"
  | "percentileValue"
  | "percentileTrace"
  | "percentileDelta"
  | "percentileFlat"
  | "percentileBand"
  | "percentileTraceAt"
>;

// only the verb+preposition differs; every phrase ends "the middle half"
const BAND_MOVE: Record<string, string> = {
  roseAbove: "moved above",
  fellBelow: "moved below",
  enteredMiddle: "moved into",
  heldAbove: "held above",
  heldMiddle: "held within",
  heldBelow: "held below",
};

export const EN_PERCENTILE_TRACE: PercentileTraceStrings = {
  noData: "No data.",
  percentileValue: (n) => `p${n}`,
  percentileTrace: (current, delta, band) => `${current} now, ${delta}; ${band}.`,
  percentileDelta: (dir, amount) => `${dir} ${amount} points from the first reading`,
  percentileFlat: "unchanged from the first reading",
  percentileBand: (movement) => `${BAND_MOVE[movement] ?? BAND_MOVE.heldMiddle} the middle half`,
  percentileTraceAt: (unit, index, value) => `${unit} ${index}: ${value}`,
};
