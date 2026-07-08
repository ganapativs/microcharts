"use client";
import { HeatCell as HeatCellInteractive } from "@microcharts/react/heat-cell/interactive";
import { DemoPanel } from "@/components/charts/demo-panel";

export function InteractiveDemo() {
  return (
    <DemoPanel hint="Hover or focus a cell — it reveals the value and its calibrated level.">
      <span className="inline-flex items-center gap-1.5">
        {[12, 35, 58, 79, 96].map((v) => (
          <HeatCellInteractive
            key={v}
            value={v}
            domain={[0, 100]}
            title="Load"
            style={{ width: 22, height: 22 }}
          />
        ))}
      </span>
    </DemoPanel>
  );
}
