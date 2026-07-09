"use client";
import { PartitionStrip as PartitionStripInteractive } from "@microcharts/react/partition-strip/interactive";
import { DemoPanel } from "@/components/charts/demo-panel";
import { TREE } from "./partition-strip";

export function InteractiveDemo() {
  return (
    <DemoPanel hint="Hover, or use ←/→ within a row and ↑/↓ between a parent and its children — each announces its share.">
      <PartitionStripInteractive data={TREE} title="Bundle composition" width={320} height={30} />
    </DemoPanel>
  );
}
