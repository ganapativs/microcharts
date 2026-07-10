// CalibrationStrip summary templates (calibration-strip) — its OWN module. The
// support disclosure is not optional: a reliability read without it is the exact
// failure this chart prevents. English lives only in core string modules (canon).
import type { SummaryStrings } from "./summary.js";

export type CalibrationStrings = Pick<
  SummaryStrings,
  "noData" | "calibration" | "calibrationGood" | "calibrationAt" | "calibrationLow"
>;

export const EN_CALIBRATION: CalibrationStrings = {
  noData: "No data.",
  calibration: (bins, p, o, low) =>
    `${bins} bins; largest gap at ${p} predicted (observed ${o}); ${low} low-support ${low === 1 ? "bin" : "bins"}.`,
  calibrationGood: (bins) => `${bins} bins; well calibrated.`,
  calibrationAt: (p, o, n, lowClause) => `predicted ${p}, observed ${o}, ${n} samples${lowClause}.`,
  calibrationLow: ", low support",
};
