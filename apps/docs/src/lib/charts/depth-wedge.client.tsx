"use client";
import { DepthWedge as DepthWedgeInteractive } from "@microcharts/react/depth-wedge/interactive";
import { DemoPanel } from "@/components/charts/demo-panel";
import { BOOK } from "./depth-wedge";

export function InteractiveDemo() {
  return (
    <DemoPanel hint="Hover or use ←/→ to walk the levels — each announces the cumulative depth on its side of the spread.">
      <DepthWedgeInteractive data={BOOK} title="Order book" width={320} height={30} />
    </DemoPanel>
  );
}
