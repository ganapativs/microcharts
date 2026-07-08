"use client";
import { StackedArea as StackedAreaInteractive } from "@microcharts/react/stacked-area/interactive";
import { DemoPanel } from "@/components/charts/demo-panel";

const MIX = [
  { label: "Mobile", values: [30, 34, 36, 40, 44, 47, 52, 56, 58, 60, 63, 66] },
  { label: "Web", values: [50, 48, 47, 45, 42, 41, 38, 36, 35, 33, 32, 30] },
  { label: "API", values: [20, 18, 17, 15, 14, 12, 10, 8, 7, 7, 5, 4] },
];

export function InteractiveDemo() {
  return (
    <DemoPanel hint="Hover or arrow across — each point announces every layer's share at once.">
      <StackedAreaInteractive data={MIX} title="Traffic mix" width={260} height={32} />
    </DemoPanel>
  );
}
