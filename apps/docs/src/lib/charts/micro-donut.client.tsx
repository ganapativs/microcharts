"use client";
import { MicroDonut as MicroDonutInteractive } from "@microcharts/react/micro-donut/interactive";
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
    <DemoPanel hint="Hover a wedge (angle lookup) or arrow through them — Other announces its members.">
      <MicroDonutInteractive data={MIX} size={96} title="Traffic mix" />
    </DemoPanel>
  );
}
