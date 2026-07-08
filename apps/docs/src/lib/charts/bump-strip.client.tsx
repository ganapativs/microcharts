"use client";
import { BumpStrip as BumpStripInteractive } from "@microcharts/react/bump-strip/interactive";
import { DemoPanel } from "@/components/charts/demo-panel";

const RANKS = [5, 5, 4, 4, 4, 3, 2, 2, 3, 2, 1, 1];

export function InteractiveDemo() {
  return (
    <DemoPanel hint="Hover or arrow through the weeks — each announces the rank held that period.">
      <BumpStripInteractive data={RANKS} title="Category rank" width={260} height={28} />
    </DemoPanel>
  );
}
