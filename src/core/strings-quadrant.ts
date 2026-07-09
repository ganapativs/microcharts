// QuadrantDot summary templates (quadrant-dot) — its OWN module (see
// strings-scalar.ts for the chunk rationale). English lives only in core string
// modules (canon). Aggregate: core/strings.ts `EN`.
import type { SummaryStrings } from "./summary.js";

export type QuadrantStrings = Pick<
  SummaryStrings,
  "noData" | "quadrantName" | "quadrant" | "quadrantLone" | "quadrantAt"
>;

const cap = (s: string): string => (s ? s[0]!.toUpperCase() + s.slice(1) : s);

export const EN_QUADRANT: QuadrantStrings = {
  noData: "No data.",
  quadrantName: (yHigh, yLabel, xHigh, xLabel) =>
    `${yHigh ? "high" : "low"}-${yLabel}, ${xHigh ? "high" : "low"}-${xLabel}`,
  quadrant: (yLabel, yv, xLabel, xv, quadName, k, n) =>
    `${cap(yLabel)} ${yv}, ${xLabel} ${xv} — in the ${quadName} quadrant (${k} of ${n} peers).`,
  quadrantLone: (yLabel, yv, xLabel, xv, quadName) =>
    `${cap(yLabel)} ${yv}, ${xLabel} ${xv} — in the ${quadName} quadrant.`,
  quadrantAt: (pos, total, xLabel, xv, yLabel, yv, quadName) =>
    `Peer ${pos} of ${total}: ${xLabel} ${xv}, ${yLabel} ${yv} — ${quadName}.`,
};
