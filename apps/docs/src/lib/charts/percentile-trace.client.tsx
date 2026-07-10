"use client";
import { PercentileTrace as PercentileTraceInteractive } from "@microcharts/react/percentile-trace/interactive";
import { DemoPanel } from "@/components/charts/demo-panel";
import { DEMO } from "./percentile-trace";

export function InteractiveDemo() {
  // DEMO referenced inside the component — this module and its registry parent
  // import each other (temporal-dead-zone trap at build otherwise).
  return (
    <DemoPanel hint="Hover or arrow across the weeks — each announces the percentile at that reading.">
      <PercentileTraceInteractive
        data={DEMO}
        unit="week"
        label="last"
        title="Standing"
        width={280}
        height={30}
      />
    </DemoPanel>
  );
}
