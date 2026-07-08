"use client";
import { MiniBar as MiniBarInteractive } from "@microcharts/react/mini-bar/interactive";
import { DemoPanel } from "@/components/charts/demo-panel";

const MIX = [
  { label: "East", value: 940 },
  { label: "West", value: 410 },
  { label: "South", value: 620 },
  { label: "North", value: 120 },
];

export function InteractiveDemo() {
  return (
    <DemoPanel hint="Hover a bar or rove with arrow keys — each announces its label, value, and rank.">
      <MiniBarInteractive data={MIX} title="Sales by region" width={200} height={64} />
    </DemoPanel>
  );
}
