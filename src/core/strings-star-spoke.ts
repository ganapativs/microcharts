// StarSpoke summary templates (star-spoke) — its OWN module. Names the extremes
// of the profile (the outlier read); no enclosed area is ever implied. English
// lives only in core string modules (canon). Aggregate: core/strings.ts.
import type { SummaryStrings } from "./summary.js";

export type StarSpokeStrings = Pick<SummaryStrings, "noData" | "starSpoke" | "spokeAt">;

export const EN_STAR_SPOKE: StarSpokeStrings = {
  noData: "No data.",
  starSpoke: (n, hi, hiValue, lo, loValue) =>
    `${n} metrics; highest ${hi} (${hiValue}), lowest ${lo} (${loValue}).`,
  spokeAt: (label, value) => `${label}: ${value}.`,
};
