"use client";
import { GardenGrid as GardenGridInteractive } from "@microcharts/react/garden-grid/interactive";
import { DemoPanel } from "@/components/charts/demo-panel";

const WEEKS = [12, 20, 8, 0, 15, 28, 34, 5, 0, 22, 18, 9, 3, 0, 24, 30, 11, 6, 19, 0, 26];

export function InteractiveDemo() {
  return (
    <DemoPanel hint="Hover a dot, or focus the grid and walk it in 2-D with the arrow keys — each cell announces its ordinal step (1–5), not a false-precise value, since dot area reads to a step not a number.">
      <GardenGridInteractive data={WEEKS} unit="weeks" title="Activity" cell={13} />
    </DemoPanel>
  );
}
