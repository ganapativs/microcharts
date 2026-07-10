"use client";
import { FoldedDayBand as FoldedDayBandInteractive } from "@microcharts/react/folded-day-band/interactive";
import { DemoPanel } from "@/components/charts/demo-panel";
import { DATA, TODAY } from "./folded-day-band";

export function InteractiveDemo() {
  return (
    <DemoPanel hint="Hover or use ←/→ across the folded axis — each position announces the median and middle half.">
      <FoldedDayBandInteractive
        data={DATA}
        today={TODAY}
        title="Typical day"
        width={320}
        height={40}
      />
    </DemoPanel>
  );
}
