"use client";
import { RateVolume as RateVolumeInteractive } from "@microcharts/react/rate-volume/interactive";
import { DemoPanel } from "@/components/charts/demo-panel";
import { DEMO } from "./rate-volume";

const PCT = { style: "percent", maximumFractionDigits: 1 } as const;

export function InteractiveDemo() {
  // computed inside the component, not at module top level: this module and its
  // registry parent import each other, so touching DEMO during module init hits
  // a temporal-dead-zone error (the registry's DEMO const isn't ready yet).
  const FRAC = DEMO.map((d) => ({ rate: d.rate / 100, volume: d.volume }));
  return (
    <DemoPanel hint="Hover or arrow across the periods — each announces the rate and the volume it stands on.">
      <RateVolumeInteractive
        data={FRAC}
        format={PCT}
        minVolume={50}
        label="last"
        title="Conversion rate"
        width={280}
        height={28}
      />
    </DemoPanel>
  );
}
