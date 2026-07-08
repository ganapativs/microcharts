"use client";
import { Slope as SlopeInteractive } from "@microcharts/react/slope/interactive";
import { DemoPanel } from "@/components/charts/demo-panel";

const RANKS = [
  { label: "East", from: 40, to: 47 },
  { label: "West", from: 55, to: 41 },
  { label: "South", from: 30, to: 33 },
  { label: "Mid", from: 20, to: 35 },
];

export function InteractiveDemo() {
  return (
    <DemoPanel hint="Hover near a line or rove with ↑/↓ (ordered by the after value) — each announces its slope.">
      <SlopeInteractive data={RANKS} title="Before vs after" width={200} height={120} />
    </DemoPanel>
  );
}
