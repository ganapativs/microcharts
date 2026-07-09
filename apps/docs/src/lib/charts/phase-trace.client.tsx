"use client";
import { PhaseTrace as PhaseTraceInteractive } from "@microcharts/react/phase-trace/interactive";
import { DemoPanel } from "@/components/charts/demo-panel";
import { TRAJ } from "./phase-trace";

export function InteractiveDemo() {
  return (
    <DemoPanel hint="Hover or step with ←/→ — each point announces its position in time and on both named axes.">
      <PhaseTraceInteractive
        data={TRAJ}
        xLabel="CPU"
        yLabel="Latency"
        grid
        title="Phase portrait"
        width={110}
        height={100}
      />
    </DemoPanel>
  );
}
