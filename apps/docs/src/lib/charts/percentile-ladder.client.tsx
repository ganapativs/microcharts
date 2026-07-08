"use client";
import { PercentileLadder as PercentileLadderInteractive } from "@microcharts/react/percentile-ladder/interactive";
import { DemoPanel } from "@/components/charts/demo-panel";

const LATENCY = Array.from({ length: 200 }, (_, i) =>
  i < 180 ? 90 + (i % 60) : i < 196 ? 400 + (i % 300) : 1400 + (i % 900),
);

export function InteractiveDemo() {
  return (
    <DemoPanel hint="Hover or arrow across the ticks — each states its value and its multiple of the median.">
      <PercentileLadderInteractive data={LATENCY} title="Request latency" width={280} height={18} />
    </DemoPanel>
  );
}
