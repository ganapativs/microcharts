"use client";
import { MicroBox as MicroBoxInteractive } from "@microcharts/react/micro-box/interactive";
import { DemoPanel } from "@/components/charts/demo-panel";

export function InteractiveDemo() {
  return (
    <DemoPanel hint="Hover or arrow through the five stops — min, Q1, median, Q3, max.">
      <MicroBoxInteractive
        stats={{ min: 12, q1: 35, median: 42, q3: 51, max: 96 }}
        title="Latency spread"
        width={260}
        height={40}
      />
    </DemoPanel>
  );
}
