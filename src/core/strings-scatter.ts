// Scatter/relationship summary templates (micro-scatter; later quadrant/phase
// types) — a separate MODULE (see strings-scalar.ts for the chunk rationale).
// English lives only in core string modules (canon). Aggregate: strings.ts EN.
import type { SummaryStrings } from "./summary.js";

export type ScatterStrings = Pick<SummaryStrings, "noData" | "scatterCount" | "relationship">;

export const EN_SCATTER: ScatterStrings = {
  noData: "No data.",
  scatterCount: (count) => `${count} points.`,
  relationship: (tier, direction, r) => {
    const t = tier === "strong" ? "Strong" : tier === "moderate" ? "Moderate" : "Weak";
    return tier === "none" ? "No clear relationship." : `${t} ${direction} relationship (r ${r}).`;
  },
};
