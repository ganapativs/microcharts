"use client";
import { ForecastCone as ForecastConeInteractive } from "@microcharts/react/forecast-cone/interactive";
import { DemoPanel } from "@/components/charts/demo-panel";
import { HIST, FORE } from "./forecast-cone";

export function InteractiveDemo() {
  // HIST/FORE referenced inside the component — this module and its registry
  // parent import each other (temporal-dead-zone trap at build otherwise).
  return (
    <DemoPanel hint="Hover or arrow across the weeks — history announces a value, the forecast region announces the median and 80% interval.">
      <ForecastConeInteractive
        data={HIST}
        forecast={FORE}
        target={45}
        title="Q4 revenue"
        width={280}
        height={28}
      />
    </DemoPanel>
  );
}
