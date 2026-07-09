"use client";
import { BurnChart as BurnChartInteractive } from "@microcharts/react/burn-chart/interactive";
import { DemoPanel } from "@/components/charts/demo-panel";
import { PLAN, ACTUAL } from "./burn-chart";

export function InteractiveDemo() {
  // PLAN/ACTUAL referenced inside the component — this module and its registry
  // parent import each other (temporal-dead-zone trap at build otherwise).
  return (
    <DemoPanel hint="Hover or arrow across the days — history announces actual vs plan, the dotted region announces the projection.">
      <BurnChartInteractive
        data={{ plan: PLAN, actual: ACTUAL }}
        label="gap"
        title="Sprint 12"
        width={280}
        height={30}
      />
    </DemoPanel>
  );
}
