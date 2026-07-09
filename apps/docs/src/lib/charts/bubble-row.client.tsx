"use client";
import { BubbleRow as BubbleRowInteractive } from "@microcharts/react/bubble-row/interactive";
import { DemoPanel } from "@/components/charts/demo-panel";

const REGIONS = [
  { label: "EMEA", value: 1240 },
  { label: "AMER", value: 890 },
  { label: "APAC", value: 560 },
  { label: "LATAM", value: 210 },
];

export function InteractiveDemo() {
  return (
    <DemoPanel hint="Hover or arrow ←/→ across the bubbles — each announces its exact value, the number the low-precision area can't carry. Area comparison is impressionistic; for a precise read, reach for MiniBar.">
      <BubbleRowInteractive data={REGIONS} title="Market size" height={44} />
    </DemoPanel>
  );
}
