"use client";
import { HistogramStrip as HistogramStripInteractive } from "@microcharts/react/histogram-strip/interactive";
import { DemoPanel } from "@/components/charts/demo-panel";

const TIMES = Array.from({ length: 120 }, (_, i) =>
  i % 3 === 0 ? 40 + (i % 10) : 20 + ((i * 7) % 60),
);

export function InteractiveDemo() {
  return (
    <DemoPanel hint="Hover or arrow through the bins — each announces its range and count.">
      <HistogramStripInteractive
        data={TIMES}
        title="Response times"
        style={{ width: 260, height: 64 }}
      />
    </DemoPanel>
  );
}
