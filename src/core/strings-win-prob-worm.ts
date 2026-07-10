// WinProbWorm summary templates (win-prob-worm) — its OWN module. A win-
// probability worm is a modelled read, so every summary is framed "per the
// supplied model" — the chart states who leads and when it flipped, never
// endorses the forecast. English lives only in core string modules (canon).
// Aggregate: strings.ts.
import type { SummaryStrings } from "./summary.js";

export type WinProbWormStrings = Pick<
  SummaryStrings,
  "noData" | "winProbWorm" | "winProbWormFlat" | "winProbWormTied" | "winProbWormAt"
>;

export const EN_WIN_PROB_WORM: WinProbWormStrings = {
  noData: "No data.",
  winProbWorm: (leader, prob, flips, swingAt, swingDelta) =>
    `Per the supplied model, ${leader} leads at ${prob}; ${
      flips === 0 ? "no lead changes" : flips === 1 ? "1 lead change" : `${flips} lead changes`
    }, biggest swing ${swingDelta} at point ${swingAt}.`,
  winProbWormFlat: (leader, prob) => `Per the supplied model, ${leader} holds ${prob} throughout.`,
  winProbWormTied: (prob) => `Per the supplied model, even at ${prob} throughout.`,
  winProbWormAt: (pos, leader, prob) => `Point ${pos}: ${leader} ${prob}.`,
};
