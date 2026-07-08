"use client";
import { DotPlot as DotPlotInteractive } from "@microcharts/react/dot-plot/interactive";
import { DemoPanel } from "@/components/charts/demo-panel";

const TEAM = [
  { label: "Ada", value: 96 },
  { label: "Kim", value: 41 },
  { label: "Sam", value: 88 },
  { label: "Noor", value: 73 },
  { label: "Lee", value: 60 },
];

export function InteractiveDemo() {
  return (
    <DemoPanel hint="Hover a row or rove with ↑/↓ — each announces its name, value, and rank.">
      <DotPlotInteractive data={TEAM} title="Review scores" width={220} height={110} />
    </DemoPanel>
  );
}
