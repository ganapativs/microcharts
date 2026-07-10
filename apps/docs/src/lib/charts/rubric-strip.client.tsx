"use client";
import { RubricStrip as RubricStripInteractive } from "@microcharts/react/rubric-strip/interactive";
import { DemoPanel } from "@/components/charts/demo-panel";
import { RUBRIC } from "./rubric-strip";

export function InteractiveDemo() {
  return (
    <DemoPanel hint="Hover or use ↑/↓ across the criteria — each announces its score and weight share.">
      <RubricStripInteractive
        data={RUBRIC}
        target={0.7}
        title="Model eval"
        width={260}
        height={40}
      />
    </DemoPanel>
  );
}
