"use client";
import { MicroScatter as MicroScatterInteractive } from "@microcharts/react/micro-scatter/interactive";
import { DemoPanel } from "@/components/charts/demo-panel";

const CLOUD = Array.from({ length: 24 }, (_, i) => ({
  x: i,
  y: i * 3 + ((i * 7) % 5) * 6,
}));

export function InteractiveDemo() {
  return (
    <DemoPanel hint="Hover the nearest point or step by x with ←/→ — each announces its pair.">
      <MicroScatterInteractive
        data={CLOUD}
        trend
        title="Spend vs conversions"
        style={{ width: 220, height: 132 }}
      />
    </DemoPanel>
  );
}
