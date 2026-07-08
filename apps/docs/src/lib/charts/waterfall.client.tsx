"use client";
import { Waterfall as WaterfallInteractive } from "@microcharts/react/waterfall/interactive";
import { DemoPanel } from "@/components/charts/demo-panel";

const PL = [
  { label: "Product", value: 42 },
  { label: "Services", value: 18 },
  { label: "Refunds", value: -12 },
  { label: "Opex", value: -26 },
  { label: "FX", value: 5 },
];

export function InteractiveDemo() {
  return (
    <DemoPanel hint="Hover or arrow through the steps — each announces its delta and the running level.">
      <WaterfallInteractive
        data={PL}
        start={60}
        title="Net income bridge"
        style={{ width: 260, height: 32 }}
      />
    </DemoPanel>
  );
}
