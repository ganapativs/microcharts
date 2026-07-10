"use client";
import { CalibrationStrip as CalibrationStripInteractive } from "@microcharts/react/calibration-strip/interactive";
import { DemoPanel } from "@/components/charts/demo-panel";
import { BINS } from "./calibration-strip";

export function InteractiveDemo() {
  return (
    <DemoPanel hint="Hover or use ←/→ across the bins — each announces predicted vs observed and its sample support.">
      <CalibrationStripInteractive data={BINS} title="Model calibration" width={300} height={44} />
    </DemoPanel>
  );
}
