// ABStrips summary templates (ab-strips). The overlap number is always in the summary — the
// overlap IS the honest answer.
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
