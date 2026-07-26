// FillWord summary templates (fill-word). The word names the task; the percent is of the
// word's own inked extent (fill-mode = complete, drain-mode = remaining).
import type { SummaryStrings } from "./summary.js";

export type FillWordStrings = Pick<SummaryStrings, "noData" | "fillWord" | "fillWordRemaining">;

export const EN_FILL_WORD: FillWordStrings = {
  noData: "No data.",
  fillWord: (word, pct) => `${word}: ${pct} complete.`,
  fillWordRemaining: (word, pct) => `${word}: ${pct} remaining.`,
};
