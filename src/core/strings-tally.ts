// TallyMarks summary templates (tally-marks) — its OWN module (a 12-px glyph
// must never bundle series templates). The count is always the TRUE value, even
// when marks overflow to a numeral or clamp — honesty backstop. English lives
// only in core string modules (canon). Aggregate: core/strings.ts `EN`.
import type { SummaryStrings } from "./summary.js";

export type TallyStrings = Pick<SummaryStrings, "noData" | "tally">;

export const EN_TALLY: TallyStrings = {
  noData: "No data.",
  tally: (value) => `${value} counted.`,
};
