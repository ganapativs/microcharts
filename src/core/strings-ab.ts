// ABStrips summary templates (ab-strips) — its OWN module (see strings-scalar.ts
// for the chunk rationale). The overlap number is always in the summary — the
// overlap IS the honest answer (plan/16). English lives only in core string
// modules (canon). Aggregate: core/strings.ts `EN`.
import type { SummaryStrings } from "./summary.js";

export type ABStrings = Pick<
  SummaryStrings,
  "noData" | "ab" | "abSeparated" | "abNoDiff" | "abRow" | "abEdge"
>;

export const EN_AB: ABStrings = {
  noData: "No data.",
  ab: (bLabel, bMed, aLabel, aMed, delta, overlapPct) =>
    `${bLabel} median ${bMed} vs ${aLabel} ${aMed} (${delta}); middle halves overlap ${overlapPct}.`,
  abSeparated: " Clearly separated.",
  abNoDiff: " No clear difference.",
  abRow: (label, med, amount, dir, other) => `${label} median ${med}, ${amount} ${dir} ${other}.`,
  abEdge: (label, p, value) => `${label} p${p}: ${value}.`,
};
