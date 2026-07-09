"use client";
import { ShiftHistogram as ShiftHistogramInteractive } from "@microcharts/react/shift-histogram/interactive";
import { DemoPanel } from "@/components/charts/demo-panel";
import { BEFORE, AFTER, MS } from "./shift-histogram";

export function InteractiveDemo() {
  // BEFORE/AFTER/MS referenced inside the component — this module and its
  // registry parent import each other (temporal-dead-zone trap at build).
  return (
    <DemoPanel hint="Hover or arrow across the bins — each announces the before/after proportions; M jumps to the median bins.">
      <ShiftHistogramInteractive
        data={{ before: BEFORE, after: AFTER }}
        format={MS}
        title="The fix"
        width={280}
        height={28}
      />
    </DemoPanel>
  );
}
