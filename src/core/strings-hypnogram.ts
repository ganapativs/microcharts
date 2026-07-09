// Hypnogram summary templates (hypnogram) — its OWN module. A categorical step
// strip: transitions + state count + the longest run are the reading. English
// lives only in core string modules (canon). Aggregate: core/strings.ts.
import type { SummaryStrings } from "./summary.js";

export type HypnogramStrings = Pick<
  SummaryStrings,
  "noData" | "hypnogram" | "hypnogramFlat" | "hypnogramRun"
>;

export const EN_HYPNOGRAM: HypnogramStrings = {
  noData: "No data.",
  hypnogram: (transitions, states, longest) =>
    `${transitions} transitions across ${states} states; longest run ${longest}.`,
  hypnogramFlat: (state) => `1 state, no transitions; ${state} throughout.`,
  hypnogramRun: (state, t0, t1) => `${state}, from ${t0} to ${t1}.`,
};
