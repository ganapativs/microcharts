// StreakSpark summary templates (streak-spark) — its OWN module. A run of equal
// outcomes; the current run is read against the record streak with a break
// count. English lives only in core string modules (canon). Aggregate: strings.ts.
import type { SummaryStrings } from "./summary.js";

export type StreakSparkStrings = Pick<
  SummaryStrings,
  | "noData"
  | "streakSpark"
  | "streakSparkUnbroken"
  | "streakSparkAllBreak"
  | "streakAt"
  | "streakRecord"
  | "streakWords"
>;

export const EN_STREAK_SPARK: StreakSparkStrings = {
  noData: "No data.",
  streakSpark: (current, word, record, breaks) =>
    `Current run ${current} ${word}; record ${record}; broke ${breaks} ${
      breaks === 1 ? "time" : "times"
    }.`,
  streakSparkUnbroken: (current, word) => `Current run ${current} ${word}, unbroken.`,
  streakSparkAllBreak: (current, word) => `Current run ${current} ${word}; no completed streak.`,
  streakAt: (pos, total, len, word, recordClause) =>
    `Run ${pos} of ${total}: ${len} ${word}${recordClause}.`,
  streakRecord: ", record",
  streakWords: ["passing", "failing"],
};
