// Scalar-chart summary templates (S3/S4 glyphs) — a separate MODULE, not just a
// separate export: bundlers keep whole chunks, so scalar templates must never
// share a chunk with the series templates (and vice versa). English lives only
// in core string modules (canon). Aggregate dictionary: core/strings.ts `EN`.
import type { SummaryStrings } from "./summary.js";

export type ScalarStrings = Pick<
  SummaryStrings,
  | "noData"
  | "scalarDir"
  | "flatChange"
  | "status"
  | "level"
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
  progress: (pct) => `${pct} complete.`,
  remaining: (pct) => `${pct} remaining.`,
  stepsDone: (done, total) => `${done} of ${total} steps.`,
  countOf: (value, total) => `${value} of ${total}.`,
};
