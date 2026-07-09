"use client";
import { ParetoStrip as ParetoStripInteractive } from "@microcharts/react/pareto-strip/interactive";
import { DemoPanel } from "@/components/charts/demo-panel";
import { CAUSES } from "./pareto-strip";

export function InteractiveDemo() {
  // CAUSES referenced inside the component — this module and its registry parent
  // import each other (temporal-dead-zone trap at build otherwise).
  return (
    <DemoPanel hint="Hover or arrow across the bars — each announces its share and the running cumulative; T jumps to the 80% crossing.">
      <ParetoStripInteractive
        data={CAUSES}
        unit="causes"
        metric="incidents"
        title="Incident causes"
        width={280}
        height={28}
      />
    </DemoPanel>
  );
}
