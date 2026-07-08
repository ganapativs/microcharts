"use client";
import { SegmentedBar as SegmentedBarInteractive } from "@microcharts/react/segmented-bar/interactive";
import { DemoPanel } from "@/components/charts/demo-panel";

const MIX = [
  { label: "Chrome", value: 620 },
  { label: "Safari", value: 240 },
  { label: "Firefox", value: 90 },
  { label: "Edge", value: 30 },
  { label: "Arc", value: 20 },
];

export function InteractiveDemo() {
  return (
    <DemoPanel hint="Hover or arrow through the segments — Other announces its member count.">
      <SegmentedBarInteractive data={MIX} title="Browser share" width={260} height={22} />
    </DemoPanel>
  );
}
