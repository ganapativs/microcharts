"use client";
import { DualSparkline as DualSparklineInteractive } from "@microcharts/react/dual-sparkline/interactive";
import { DemoPanel } from "@/components/charts/demo-panel";

const US = [12, 13, 12.4, 14, 15.2, 14.8, 16, 17.5, 17, 18.4, 19, 21];
const BENCH = [12, 12.4, 12.8, 13.1, 13.6, 14, 14.2, 14.8, 15, 15.4, 15.8, 16];

export function InteractiveDemo() {
  return (
    <DemoPanel hint="Hover or arrow across — each point announces both values side by side.">
      <DualSparklineInteractive
        data={US}
        compare={BENCH}
        title="Conversion vs market"
        style={{ width: 260, height: 30 }}
      />
    </DemoPanel>
  );
}
