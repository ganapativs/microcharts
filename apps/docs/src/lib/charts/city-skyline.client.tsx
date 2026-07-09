"use client";
import { CitySkyline as CitySkylineInteractive } from "@microcharts/react/city-skyline/interactive";
import { DemoPanel } from "@/components/charts/demo-panel";

const TEAMS = [
  { label: "Platform", value: 46, lit: 0.7 },
  { label: "Core", value: 32, lit: 0.5 },
  { label: "Web", value: 28, lit: 0.9 },
  { label: "API", value: 40, lit: 0.3 },
  { label: "Data", value: 18, lit: 0.6 },
];

export function InteractiveDemo() {
  return (
    <DemoPanel hint="Hover or arrow ←/→ across the buildings — each announces its size and its lit fraction. Height is the precise read; the lit windows are impressionistic (mostly lit / half lit / dark).">
      <CitySkylineInteractive
        data={TEAMS}
        labels
        unit="teams"
        title="Team sizes"
        bw={18}
        gap={7}
        height={52}
      />
    </DemoPanel>
  );
}
