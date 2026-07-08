"use client";
import { Funnel as FunnelInteractive } from "@microcharts/react/funnel/interactive";
import { DemoPanel } from "@/components/charts/demo-panel";

const PIPE = [
  { label: "Visitors", value: 12400 },
  { label: "Signups", value: 5704 },
  { label: "Activated", value: 2730 },
  { label: "Paid", value: 1116 },
];

export function InteractiveDemo() {
  return (
    <DemoPanel hint="Hover or arrow through the stages — each announces its retained share of the first.">
      <FunnelInteractive data={PIPE} title="Signup funnel" width={260} height={78} />
    </DemoPanel>
  );
}
