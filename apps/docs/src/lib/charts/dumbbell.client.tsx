"use client";
import { Dumbbell as DumbbellInteractive } from "@microcharts/react/dumbbell/interactive";
import { DemoPanel } from "@/components/charts/demo-panel";

const BANDS = [
  { label: "Paris", from: 52, to: 61 },
  { label: "Berlin", from: 48, to: 68 },
  { label: "Oslo", from: 66, to: 60 },
];

export function InteractiveDemo() {
  return (
    <DemoPanel hint="Rove rows with ↑/↓; ←/→ inspect the from/to ends of the active row.">
      <DumbbellInteractive data={BANDS} title="Band moves" style={{ width: 240, height: 72 }} />
    </DemoPanel>
  );
}
