"use client";
import { MinimapStrip as MinimapStripInteractive } from "@microcharts/react/minimap-strip/interactive";
import { DemoPanel } from "@/components/charts/demo-panel";
import { DATA } from "./minimap-strip";

export function InteractiveDemo() {
  return (
    <DemoPanel hint="Drag or click to move the viewport window; ←/→ nudge it (Shift for a bigger jump).">
      <MinimapStripInteractive
        data={DATA}
        domain={[0, 1200]}
        title="Document position"
        width={320}
        height={20}
      />
    </DemoPanel>
  );
}
