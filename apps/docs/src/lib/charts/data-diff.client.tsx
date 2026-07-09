"use client";
import { DataDiff as DataDiffInteractive } from "@microcharts/react/data-diff/interactive";
import { DemoPanel } from "@/components/charts/demo-panel";
import { DIFF } from "./data-diff";

export function InteractiveDemo() {
  // DIFF referenced inside the component — this module and its registry parent
  // import each other (temporal-dead-zone trap at build otherwise).
  return (
    <DemoPanel hint="Hover or arrow down the rows — each announces its added, removed, and net change.">
      <DataDiffInteractive data={DIFF} labels title="Schema diff" width={240} height={96} />
    </DemoPanel>
  );
}
