// VolumeProfile summary templates (volume-profile). The value area is a stated convention
// (default 70%, visible in docs + summary), not an implied confidence interval.
import type { SummaryStrings } from "./summary.js";

export type VolumeProfileStrings = Pick<
  SummaryStrings,
  "noData" | "volumeProfile" | "volumeEven" | "volumeAt" | "volumePoc"
>;

export const EN_VOLUME_PROFILE: VolumeProfileStrings = {
  noData: "No data.",
  volumeProfile: (poc, va, lo, hi) =>
    `Activity concentrates at ${poc} (POC); ${va} within ${lo}–${hi}.`,
  volumeEven: "Activity is evenly spread.",
  volumeAt: (level, pct, pocClause, mass) =>
    `level ${level}: ${mass}, ${pct} of activity${pocClause}.`,
  volumePoc: " (POC)",
};
