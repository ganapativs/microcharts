"use client";
import { SproutRow as SproutRowInteractive } from "@microcharts/react/sprout-row/interactive";
import { DemoPanel } from "@/components/charts/demo-panel";

const ACCTS = [
  { label: "Acme", value: 3 },
  { label: "Beta", value: 2 },
  { label: "Gamma", value: 3 },
  { label: "Delta", value: 1 },
  { label: "Echo", value: 0 },
  { label: "Foxtrot", value: 2 },
];

export function InteractiveDemo() {
  return (
    <DemoPanel hint="Hover or arrow ←/→ across the row — each item announces its stage (seed → sprout → leaf → bloom), and a ring lifts the focused glyph. Taller means further along, so the ordering reads without the key.">
      <SproutRowInteractive data={ACCTS} labels title="Account health" height={36} step={26} />
    </DemoPanel>
  );
}
