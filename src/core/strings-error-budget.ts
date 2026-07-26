// ErrorBudget summary templates (error-budget)
import type { SummaryStrings } from "./summary.js";

export type ErrorBudgetStrings = Pick<
  SummaryStrings,
  "noData" | "errorBudget" | "errorBudgetExhausted" | "errorBudgetAt"
>;

export const EN_ERROR_BUDGET: ErrorBudgetStrings = {
  noData: "No data.",
  errorBudget: (remaining, elapsed, total, unit, rate) =>
    `${remaining} of error budget remains at ${unit} ${elapsed} of ${total} — burning at ${rate}× the steady rate.`,
  errorBudgetExhausted: (unit, at, total) => `Budget exhausted at ${unit} ${at} of ${total}.`,
  errorBudgetAt: (unit, at, total, remaining, rate) =>
    `${unit} ${at} of ${total}: ${remaining} budget remaining, burning at ${rate}× steady rate.`,
};
