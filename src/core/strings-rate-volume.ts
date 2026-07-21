// RateVolume summary templates (rate-volume) — a separate MODULE (see
// strings-scalar.ts for the chunk rationale). This chart never states a rate
// without its volume, so both numbers are always in the string. English lives
// only in core string modules (canon). Aggregate: core/strings.ts `EN`.
import type { SummaryStrings } from "./summary.js";

export type RateVolumeStrings = Pick<
  SummaryStrings,
  | "noData"
  | "rateVolume"
  | "rateVolumeShort"
  | "rateVolumeAt"
  | "rateVolumeNoEvents"
  | "rateVolumeChip"
  | "rateVolumeChipEmpty"
>;

const lowFlag = (low: boolean): string => (low ? " (low volume)" : "");

export const EN_RATE_VOLUME: RateVolumeStrings = {
  noData: "No data.",
  rateVolume: (rateLast, volumeLast, unit, low, direction, rateFirst, n) =>
    `${rateLast} on ${volumeLast} ${unit}${lowFlag(low)}; ${direction} from ${rateFirst} across ${n} periods.`,
  rateVolumeShort: (rateLast, volumeLast, unit, low) =>
    `${rateLast} on ${volumeLast} ${unit}${lowFlag(low)}.`,
  rateVolumeAt: (position, total, rate, volume, unit, low) =>
    `Period ${position} of ${total}: ${rate} on ${volume} ${unit}${lowFlag(low)}.`,
  rateVolumeNoEvents: (position, total) => `Period ${position} of ${total}: no events.`,
  rateVolumeChip: (rate, volume, unit, low) => `${rate} · ${volume} ${unit}${low ? " (low)" : ""}`,
  rateVolumeChipEmpty: "no events",
};
