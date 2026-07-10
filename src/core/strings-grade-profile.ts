// GradeProfile summary templates (grade-profile) — its OWN module. Grade is
// rise ÷ run as a percent, quantized into difficulty bins; the decision read is
// "how hard, and where". English lives only in core string modules (canon).
// Aggregate: strings.ts. SummaryStrings members are wired serially, not here.
import type { SummaryStrings } from "./summary.js";

export type GradeProfileStrings = Pick<
  SummaryStrings,
  "noData" | "gradeProfile" | "gradeProfileFlat" | "gradeProfileAt" | "gradeMax"
>;

export const EN_GRADE_PROFILE: GradeProfileStrings = {
  noData: "No data.",
  gradeProfile: (distance, gain, grade, at) =>
    `${distance}, ${gain} gain; steepest ${grade} at ${at}.`,
  gradeProfileFlat: (distance) => `${distance}, no real climb.`,
  gradeProfileAt: (at, grade, gain) => `${at}: ${grade}, ${gain} gained.`,
  gradeMax: (grade) => `${grade} max`,
};
