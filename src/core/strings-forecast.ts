// ForecastCone summary templates (forecast-cone)
import type { SummaryStrings } from "./summary.js";

export type ForecastStrings = Pick<
  SummaryStrings,
  "noData" | "forecast" | "forecastClearance" | "forecastAtHistory" | "forecastAtForecast"
>;

export const EN_FORECAST: ForecastStrings = {
  noData: "No data.",
  forecast: (mid, at, unit, lo, hi, now) =>
    now === null
      ? `Median forecast ${mid} by ${unit} ${at} (80% between ${lo} and ${hi}).`
      : `Median forecast ${mid} by ${unit} ${at} (80% between ${lo} and ${hi}), from ${now} today.`,
  forecastClearance: (status, target) => ` The 80% band ${status} the ${target} target.`,
  forecastAtHistory: (unit, period, value) => `${unit} ${period}: ${value}.`,
  forecastAtForecast: (unit, period, mid, lo, hi) =>
    `${unit} ${period} (forecast): median ${mid}, 80% between ${lo} and ${hi}.`,
};
