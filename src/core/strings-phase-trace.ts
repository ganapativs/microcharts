// PhaseTrace summary templates (phase-trace). Axes are named and stated (linear domains);
// time direction stays recoverable in the reading.
import type { SummaryStrings } from "./summary.js";

export type PhaseTraceStrings = Pick<
  SummaryStrings,
  "noData" | "phaseTrace" | "phaseHeadings" | "phaseAt"
>;

export const EN_PHASE_TRACE: PhaseTraceStrings = {
  noData: "No data.",
  phaseTrace: (yLabel, xLabel, x, y, direction) =>
    `${yLabel} vs ${xLabel}: now ${x}, ${y}; heading ${direction}.`,
  phaseHeadings: ["up-right", "up-left", "down-right", "down-left", "steady"],
  phaseAt: (i, n, xLabel, x, yLabel, y) => `point ${i} of ${n}: ${xLabel} ${x}, ${yLabel} ${y}.`,
};
