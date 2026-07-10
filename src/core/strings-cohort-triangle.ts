// CohortTriangle summary templates (cohort-triangle) — its OWN module. Rows are
// vintages, columns are age; the equal-maturity comparison is the decision read.
// English lives only in core string modules (canon). Aggregate: core/strings.ts.
import type { SummaryStrings } from "./summary.js";

export type CohortTriangleStrings = Pick<
  SummaryStrings,
  "noData" | "cohortTriangle" | "cohortTriangleShort" | "cohortTriangleAt" | "cohortTriangleEmpty"
>;

export const EN_COHORT_TRIANGLE: CohortTriangleStrings = {
  noData: "No data.",
  cohortTriangle: (n, unit, worstLabel, age, worstValue, newestLabel, newestFirst) =>
    `${n} cohorts; at ${unit} ${age}, ${worstLabel} retains worst (${worstValue}); newest ${newestLabel} starts at ${newestFirst}.`,
  cohortTriangleShort: (n, newestLabel, newestFirst) =>
    `${n} cohort${n === 1 ? "" : "s"}; ${newestLabel} starts at ${newestFirst}.`,
  cohortTriangleAt: (cohortLabel, unit, age, value) =>
    `${cohortLabel} cohort, ${unit} ${age}: ${value}.`,
  cohortTriangleEmpty: (cohortLabel, unit, age) =>
    `${cohortLabel} cohort, ${unit} ${age}: no data.`,
};
