// StarSpoke summary templates (star-spoke). Names the extremes of the profile (the outlier
// read); no enclosed area is ever implied.
import type { SummaryStrings } from "./summary.js";

export type StarSpokeStrings = Pick<
  SummaryStrings,
  "noData" | "starSpoke" | "spokeAt" | "spokeEmpty"
>;

export const EN_STAR_SPOKE: StarSpokeStrings = {
  noData: "No data.",
  starSpoke: (n, hi, hiValue, lo, loValue) =>
    `${n} metrics; highest ${hi} (${hiValue}), lowest ${lo} (${loValue}).`,
  spokeAt: (label, value) => `${label}: ${value}.`,
  spokeEmpty: (label) => `${label}: no data.`,
};
