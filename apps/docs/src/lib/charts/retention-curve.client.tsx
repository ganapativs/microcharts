"use client";
import { RetentionCurve as RetentionCurveInteractive } from "@microcharts/react/retention-curve/interactive";
import { DemoPanel } from "@/components/charts/demo-panel";
import { DEMO, BENCH } from "./retention-curve";

export function InteractiveDemo() {
  // DEMO/BENCH referenced inside the component — this module and its registry
  // parent import each other (temporal-dead-zone trap at build otherwise).
  return (
    <DemoPanel hint="Hover or arrow across the weeks — each announces retention and the benchmark.">
      <RetentionCurveInteractive
        data={DEMO}
        benchmark={BENCH}
        unit="week"
        label="last"
        title="W12 cohort"
        width={280}
        height={30}
      />
    </DemoPanel>
  );
}
