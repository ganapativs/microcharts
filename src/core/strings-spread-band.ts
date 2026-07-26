// SpreadBand summary templates (spread-band). The read is a lead: who is ahead, by how
// much, and since when it last flipped.
import type { SummaryStrings } from "./summary.js";

export type SpreadBandStrings = Pick<
  SummaryStrings,
  | "noData"
  | "spreadBand"
  | "spreadBandFlip"
  | "spreadBandNever"
  | "spreadBandTie"
  | "spreadBandAt"
  | "spreadBandAtTie"
  | "spreadBandAtEmpty"
>;

export const EN_SPREAD_BAND: SpreadBandStrings = {
  noData: "No data.",
  spreadBand: (leader, other, gap, sinceClause) =>
    `${leader} leads ${other} by ${gap}${sinceClause}.`,
  spreadBandFlip: (position) => `; last crossed at point ${position}`,
  spreadBandNever: "; never crossed",
  spreadBandTie: "The two series are level — no gap.",
  spreadBandAt: (position, total, leader, gap, other) =>
    `Point ${position} of ${total}: ${leader} ${gap} over ${other}.`,
  spreadBandAtTie: (position, total) => `Point ${position} of ${total}: level.`,
  spreadBandAtEmpty: (position, total) => `Point ${position} of ${total}: no data.`,
};
