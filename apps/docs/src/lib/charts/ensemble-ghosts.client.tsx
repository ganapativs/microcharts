"use client";
import { EnsembleGhosts as EnsembleGhostsInteractive } from "@microcharts/react/ensemble-ghosts/interactive";
import { DemoPanel } from "@/components/charts/demo-panel";
import { FUTURES } from "./ensemble-ghosts";

export function InteractiveDemo() {
  // FUTURES referenced inside the component — this module and its registry parent
  // import each other (temporal-dead-zone trap at build otherwise).
  return (
    <DemoPanel hint="Hover to flip through the futures one at a time (the HOP loop); with reduced motion, arrow keys step them instead — each member is announced.">
      <EnsembleGhostsInteractive
        data={FUTURES}
        endpoints
        title="Simulated futures"
        width={280}
        height={48}
      />
    </DemoPanel>
  );
}
