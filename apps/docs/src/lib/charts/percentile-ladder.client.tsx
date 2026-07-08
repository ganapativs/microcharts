"use client";
import { PercentileLadder as PercentileLadderInteractive } from "@microcharts/react/percentile-ladder/interactive";
import { DemoPanel } from "@/components/charts/demo-panel";

const LATENCY = Array.from({ length: 200 }, (_, i) =>
  i < 130
    ? 90 + (i % 50)
    : i < 180
      ? 150 + ((i * 7) % 320)
      : i < 196
        ? 480 + ((i * 11) % 900)
        : 1500 + ((i * 13) % 800),
);

export function InteractiveDemo() {
  return (
    <DemoPanel hint="Hover or arrow across the ticks — each states its value and its multiple of the median.">
      <PercentileLadderInteractive data={LATENCY} title="Request latency" width={280} height={18} />
    </DemoPanel>
  );
}
