// CyclePlot summary templates (cycle-plot) — its OWN module (see
// strings-scalar.ts for the chunk rationale). English lives only in core string
// modules (canon). Aggregate: core/strings.ts `EN`.
import type { SummaryStrings } from "./summary.js";

export type CycleStrings = Pick<
  SummaryStrings,
  "noData" | "cycle" | "cycleNoDrift" | "cycleAt" | "cyclePoint" | "cycleEmpty" | "cycleDriftNames"
>;

export const EN_CYCLE: CycleStrings = {
  noData: "No data.",
  cycle: (peakSlot, peak, dipSlot, dip, driftSlot, driftDir, cycles, cycleUnit) =>
    `Peaks ${peakSlot} (${peak}), dips ${dipSlot} (${dip}); ${driftSlot} ${driftDir} across ${cycles} ${cycleUnit}.`,
  cycleNoDrift: (peakSlot, peak, dipSlot, dip) =>
    `Peaks ${peakSlot} (${peak}), dips ${dipSlot} (${dip}).`,
  cycleAt: (slotName, center, value, cycles, cycleUnit, driftDir) =>
    `${slotName}: ${center} ${value} across ${cycles} ${cycleUnit}, ${driftDir}.`,
  cyclePoint: (slotName, pos, total, value) => `${slotName}, cycle ${pos} of ${total}: ${value}.`,
  cycleEmpty: (slotName) => `${slotName}: no data.`,
  cycleDriftNames: ["falling", "steady", "rising"],
};
