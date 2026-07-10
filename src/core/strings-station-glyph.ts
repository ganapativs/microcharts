// StationGlyph strings (plan/25 §20, plan/17 F2). A meteorological station model
// at word scale: sky-cover disc + wind barb + corner numerals. Reuses the wind
// compass. No hardcoded English outside EN (i18n contract).
import type { SummaryStrings } from "./summary.js";

export type StationGlyphStrings = Pick<
  SummaryStrings,
  "noData" | "compass8" | "stationGlyph" | "stationSky" | "stationWind" | "stationCalm"
>;

export const EN_STATION_GLYPH: StationGlyphStrings = {
  noData: "No data.",
  compass8: ["north", "northeast", "east", "southeast", "south", "southwest", "west", "northwest"],
  stationSky: ["clear", "few clouds", "scattered", "broken", "overcast"],
  stationCalm: ", wind calm",
  stationWind: (octantName, magnitude) => `, wind ${octantName} ${magnitude}`,
  stationGlyph: (station, windClause, sky, fieldsClause) =>
    `${station}${windClause}; sky ${sky}${fieldsClause}.`,
};
