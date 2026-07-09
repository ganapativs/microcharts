"use client";
import { IconArray as IconArrayInteractive } from "@microcharts/react/icon-array/interactive";
import { DemoPanel } from "@/components/charts/demo-panel";

export function InteractiveDemo() {
  return (
    <DemoPanel hint="Hover or arrow through the units — each announces the running count.">
      <IconArrayInteractive value={0.15} of={20} title="Adverse events" width={200} height={30} />
    </DemoPanel>
  );
}
