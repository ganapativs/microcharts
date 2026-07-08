"use client";
import { CoverageStrip as CoverageStripInteractive } from "@microcharts/react/coverage-strip/interactive";
import { DemoPanel } from "@/components/charts/demo-panel";

const COVERAGE = [3, 4, null, 5, 0, null, null, 6, 8, 7, null, 9, 11, 10];

export function InteractiveDemo() {
  return (
    <DemoPanel hint="Hover or arrow through the slots — each says whether it was measured, or missing.">
      <CoverageStripInteractive
        data={COVERAGE}
        expected={18}
        label="percent"
        title="Sensor uptime"
        width={260}
        height={16}
      />
    </DemoPanel>
  );
}
