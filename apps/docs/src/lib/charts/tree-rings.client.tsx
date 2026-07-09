"use client";
import { TreeRings as TreeRingsInteractive } from "@microcharts/react/tree-rings/interactive";
import { DemoPanel } from "@/components/charts/demo-panel";

const YEARS = [8, 12, 10, 18, 22, 15, 20, 14];

export function InteractiveDemo() {
  return (
    <DemoPanel hint="Hover a ring, or arrow ←/→ from the centre out — each period announces its value. The channel is ring thickness, not area: equal thickness at a larger radius spans more area, so read thicknesses, not wedges.">
      <TreeRingsInteractive
        data={YEARS}
        label="last"
        unit="years"
        periodWord="year"
        title="Account age"
        size={64}
      />
    </DemoPanel>
  );
}
