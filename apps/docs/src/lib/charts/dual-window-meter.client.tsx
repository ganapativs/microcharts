"use client";
import { DualWindowMeter as DualWindowMeterInteractive } from "@microcharts/react/dual-window-meter/interactive";
import { DemoPanel } from "@/components/charts/demo-panel";
import { LOUDNESS } from "./dual-window-meter";

export function InteractiveDemo() {
  return (
    <DemoPanel hint="Hover or arrow across the samples — the thin fast window and thick slow window read against the target.">
      <DualWindowMeterInteractive
        data={LOUDNESS}
        target={-23}
        title="Loudness"
        width={320}
        height={28}
      />
    </DemoPanel>
  );
}
