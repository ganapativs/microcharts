"use client";
import { Horizon as HorizonInteractive } from "@microcharts/react/horizon/interactive";
import { DemoPanel } from "@/components/charts/demo-panel";

const LOAD = [
  2, 5, 9, 14, 22, 31, 26, 18, 12, 24, 38, 45, 41, 30, 19, 11, 6, 3, 8, 16, 27, 35, 29, 20,
];

export function InteractiveDemo() {
  return (
    <DemoPanel hint="Hover or arrow across — each point announces its unfolded value.">
      <HorizonInteractive data={LOAD} title="Cluster load" width={260} height={24} />
    </DemoPanel>
  );
}
