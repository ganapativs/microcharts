"use client";
import { BenchmarkStrip as BenchmarkStripInteractive } from "@microcharts/react/benchmark-strip/interactive";
import { DemoPanel } from "@/components/charts/demo-panel";

const PEERS = Array.from(
  { length: 42 },
  (_, i) => 180 + Math.round(220 * Math.sin(i / 5) ** 2) + (i % 7) * 12,
);

export function InteractiveDemo() {
  return (
    <DemoPanel hint="Hover or arrow across the quantile edges — each names its percentile and value.">
      <BenchmarkStripInteractive
        data={PEERS}
        value={312}
        title="Latency vs peers"
        width={280}
        height={16}
      />
    </DemoPanel>
  );
}
