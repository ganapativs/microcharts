"use client";
import { GradedBand as GradedBandInteractive } from "@microcharts/react/graded-band/interactive";
import { DemoPanel } from "@/components/charts/demo-panel";

const DRAWS = Array.from(
  { length: 160 },
  (_, i) => 21 + Math.round(9 * Math.sin(i) + 6 * Math.sin(i * 2.3)),
);

export function InteractiveDemo() {
  return (
    <DemoPanel hint="Hover or arrow outward from the median — each level announces its interval.">
      <GradedBandInteractive
        data={DRAWS}
        label="median"
        title="Forecast estimate"
        width={280}
        height={16}
      />
    </DemoPanel>
  );
}
