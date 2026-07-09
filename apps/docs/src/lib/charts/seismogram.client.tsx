"use client";
import { Seismogram as SeismogramInteractive } from "@microcharts/react/seismogram/interactive";
import { DemoPanel } from "@/components/charts/demo-panel";
import { BURSTS } from "./seismogram";

export function InteractiveDemo() {
  return (
    <DemoPanel hint="Hover or arrow through the slots; Home/End jump to the first/last event.">
      <SeismogramInteractive data={BURSTS} title="Error bursts" width={260} height={36} />
    </DemoPanel>
  );
}
