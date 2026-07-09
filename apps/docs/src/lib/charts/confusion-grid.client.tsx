"use client";
import { ConfusionGrid as ConfusionGridInteractive } from "@microcharts/react/confusion-grid/interactive";
import { DemoPanel } from "@/components/charts/demo-panel";
import { THREE } from "./confusion-grid";

export function InteractiveDemo() {
  return (
    <DemoPanel hint="Hover or use the arrow keys across the grid — each cell announces actual vs predicted as a share of the actual class.">
      <ConfusionGridInteractive data={THREE} title="Classifier" size={120} />
    </DemoPanel>
  );
}
