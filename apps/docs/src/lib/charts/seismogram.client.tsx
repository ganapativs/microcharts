"use client";
import { Seismogram as SeismogramInteractive } from "@microcharts/react/seismogram/interactive";
import { DemoPanel } from "@/components/charts/demo-panel";

const BURSTS = Array.from({ length: 48 }, (_, i) =>
  i % 9 === 0 ? (i % 27 === 0 ? 8 : 3) : i % 13 === 0 ? 1 : 0,
);

export function InteractiveDemo() {
  return (
    <DemoPanel hint="Hover or arrow through the slots; Home/End jump to the first/last event.">
      <SeismogramInteractive
        data={BURSTS}
        title="Error bursts"
        style={{ width: 260, height: 36 }}
      />
    </DemoPanel>
  );
}
