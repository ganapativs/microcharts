"use client";
import { Hypnogram as HypnogramInteractive } from "@microcharts/react/hypnogram/interactive";
import { DemoPanel } from "@/components/charts/demo-panel";
import { SLEEP, STATES } from "./hypnogram";

export function InteractiveDemo() {
  return (
    <DemoPanel hint="Hover or arrow across the runs — each announces its state and time span.">
      <HypnogramInteractive
        data={SLEEP}
        states={STATES}
        domain={[0, 120]}
        title="Sleep stages"
        width={300}
        height={30}
      />
    </DemoPanel>
  );
}
