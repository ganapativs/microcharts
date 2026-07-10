"use client";
import { TimeInRange as TimeInRangeInteractive } from "@microcharts/react/time-in-range/interactive";
import { DemoPanel } from "@/components/charts/demo-panel";

const GLUCOSE = { severeBelow: 2, below: 7, in: 72, above: 15, severeAbove: 4 };

export function InteractiveDemo() {
  return (
    <DemoPanel hint="Hover or arrow across the zones — each announces its share of the period.">
      <TimeInRangeInteractive
        data={GLUCOSE}
        title="Time in range"
        label="all"
        width={280}
        height={22}
      />
    </DemoPanel>
  );
}
