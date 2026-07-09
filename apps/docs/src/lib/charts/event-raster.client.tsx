"use client";
import { EventRaster as EventRasterInteractive } from "@microcharts/react/event-raster/interactive";
import { DemoPanel } from "@/components/charts/demo-panel";
import { RASTER } from "./event-raster";

export function InteractiveDemo() {
  return (
    <DemoPanel hint="Hover or use ↑/↓ for lanes and ←/→ for events — each announces its lane, time, and position.">
      <EventRasterInteractive data={RASTER} title="Service events" width={320} height={36} />
    </DemoPanel>
  );
}
