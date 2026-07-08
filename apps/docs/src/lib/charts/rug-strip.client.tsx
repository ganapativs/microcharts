"use client";
import { RugStrip as RugStripInteractive } from "@microcharts/react/rug-strip/interactive";
import { DemoPanel } from "@/components/charts/demo-panel";

const FIELD = [42, 48, 51, 53, 55, 58, 61, 63, 66, 71, 55, 52, 49, 58, 62, 75, 83, 58, 54, 60];

export function InteractiveDemo() {
  return (
    <DemoPanel hint="Hover for the nearest observation; arrow keys walk them in sorted order with rank readouts.">
      <RugStripInteractive
        data={FIELD}
        highlight={62}
        title="Response times"
        style={{ width: 260, height: 24 }}
      />
    </DemoPanel>
  );
}
