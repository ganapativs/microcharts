"use client";
import { PairedBars as PairedBarsInteractive } from "@microcharts/react/paired-bars/interactive";
import { DemoPanel } from "@/components/charts/demo-panel";

const BUDGET = [
  { label: "East", value: 940, ref: 1200 },
  { label: "West", value: 410, ref: 400 },
  { label: "South", value: 620, ref: 600 },
  { label: "North", value: 120, ref: 300 },
];

export function InteractiveDemo() {
  return (
    <DemoPanel hint="Hover a pair or rove with arrows — each announces value vs reference.">
      <PairedBarsInteractive data={BUDGET} title="Actual vs plan" width={220} height={72} />
    </DemoPanel>
  );
}
