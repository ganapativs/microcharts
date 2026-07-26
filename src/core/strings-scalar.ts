// Scalar-chart summary templates (S3/S4) — separate module so bundlers
// don't chunk them with series templates. Aggregate: core/strings.ts `EN`.
import type { SummaryStrings } from "./summary.js";

export type ScalarStrings = Pick<
  SummaryStrings,
  | "noData"
  | "scalarDir"
  | "flatChange"
  | "status"
  | "level"
  | "levelChip"
  | "progress"
  | "remaining"
  | "stepsDone"
  | "countOf"
>;

export const EN_SCALAR: ScalarStrings = {
  noData: "No data.",
  scalarDir: (dir, amt) => `${dir === "up" ? "Up" : "Down"} ${amt}.`,
  flatChange: "No change.",
  status: (state) => `Status: ${state}.`,
  level: (v, level, steps) => `${v} — level ${level} of ${steps}.`,
  levelChip: (v, level, steps) => `${v} — level ${level} of ${steps}`,
  progress: (pct) => `${pct} complete.`,
  remaining: (pct) => `${pct} remaining.`,
  stepsDone: (done, total) => `${done} of ${total} steps.`,
  countOf: (value, total) => `${value} of ${total}.`,
};
