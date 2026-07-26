// TapeGauge summary templates (tape-gauge). The scale scrolls, the value doesn't; rate is a
// separate channel from level.
import type { SummaryStrings } from "./summary.js";

export type TapeGaugeStrings = Pick<
  SummaryStrings,
  "noData" | "tapeGauge" | "tapeRates" | "tapeZone"
>;

export const EN_TAPE_GAUGE: TapeGaugeStrings = {
  noData: "No data.",
  tapeGauge: (value, rateClause, zoneClause) => `Now ${value}${rateClause}${zoneClause}.`,
  tapeRates: ["falling fast", "falling", "steady", "rising", "rising fast"],
  tapeZone: (from, to) => `; in the ${from}–${to} zone`,
};
