// DicePips summary templates (dice-pips) — its OWN module (a 16-px glyph must
// never bundle series templates). "out of 6" frames the subitized 0–6 range;
// past 6 the face shows the exact numeral and the summary drops the frame.
// English lives only in core string modules (canon). Aggregate: core/strings.ts.
import type { SummaryStrings } from "./summary.js";

export type DiceStrings = Pick<SummaryStrings, "noData" | "dicePips" | "dicePipsOver">;

export const EN_DICE: DiceStrings = {
  noData: "No data.",
  dicePips: (value) => `${value} out of 6.`,
  dicePipsOver: (value) => `${value}.`,
};
