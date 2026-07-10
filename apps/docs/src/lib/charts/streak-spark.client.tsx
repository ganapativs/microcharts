"use client";
import { StreakSpark as StreakSparkInteractive } from "@microcharts/react/streak-spark/interactive";
import { DemoPanel } from "@/components/charts/demo-panel";
import { STREAK } from "./streak-spark";

export function InteractiveDemo() {
  return (
    <DemoPanel hint="Hover a run, or focus and step through with ← → — each run announces its length, outcome, and whether it is the record.">
      <StreakSparkInteractive
        data={STREAK}
        label="both"
        title="Deploy streak"
        width={340}
        height={92}
        className="w-full max-w-md"
      />
    </DemoPanel>
  );
}
