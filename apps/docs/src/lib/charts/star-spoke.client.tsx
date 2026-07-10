"use client";
import { StarSpoke as StarSpokeInteractive } from "@microcharts/react/star-spoke/interactive";
import { DemoPanel } from "@/components/charts/demo-panel";
import { PROFILE } from "./star-spoke";

export function InteractiveDemo() {
  return (
    <DemoPanel hint="Hover or use ←/→ to rotate through the spokes — each announces its metric and value.">
      <StarSpokeInteractive data={PROFILE} dots="tips" title="Product profile" size={120} />
    </DemoPanel>
  );
}
