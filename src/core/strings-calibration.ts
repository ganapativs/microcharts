// CalibrationStrip summary templates (calibration-strip). The support disclosure is not
// optional: a reliability read without it is the exact failure this chart prevents.
import type { SummaryStrings } from "./summary.js";

export type CalibrationStrings = Pick<
  SummaryStrings,
  | "noData"
  | "calibration"
  | "calibrationGood"
  | "calibrationAt"
  | "calibrationLow"
  | "calibrationChip"
>;

export const EN_CALIBRATION: CalibrationStrings = {
  noData: "No data.",
  calibration: (bins, p, o, low) =>
    `${bins} bins; largest gap at ${p} predicted (observed ${o}); ${low} low-support ${low === 1 ? "bin" : "bins"}.`,
  calibrationGood: (bins) => `${bins} bins; well calibrated.`,
  calibrationAt: (p, o, n, lowClause) => `predicted ${p}, observed ${o}, ${n} samples${lowClause}.`,
  calibrationLow: ", low support",
  calibrationChip: (p, o, n, lowClause) => `${p} → ${o} (n=${n}${lowClause})`,
};
