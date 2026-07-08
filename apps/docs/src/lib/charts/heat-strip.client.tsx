"use client";
import { HeatStrip as HeatStripInteractive } from "@microcharts/react/heat-strip/interactive";
import { DemoPanel } from "@/components/charts/demo-panel";

const LOAD = Array.from({ length: 30 }, (_, i) => Math.round(Math.sin(i / 4) * 40 + 50));

export function InteractiveDemo() {
  return (
    <DemoPanel hint="Hover or arrow through the cells — each announces its position and value.">
      <HeatStripInteractive
        data={LOAD}
        domain={[0, 100]}
        title="CPU pressure"
        style={{ width: 260, height: 26 }}
      />
    </DemoPanel>
  );
}
