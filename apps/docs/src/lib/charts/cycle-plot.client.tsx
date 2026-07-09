"use client";
import { CyclePlot as CyclePlotInteractive } from "@microcharts/react/cycle-plot/interactive";
import { DemoPanel } from "@/components/charts/demo-panel";
import { WEEKS, DAYS } from "./cycle-plot";

export function InteractiveDemo() {
  // WEEKS/DAYS referenced inside the component — this module and its registry
  // parent import each other (temporal-dead-zone trap at build otherwise).
  return (
    <DemoPanel hint="Hover or arrow across the slots — each announces its mean, cycle count, and drift; ↑/↓ steps the individual weeks within a slot.">
      <CyclePlotInteractive
        data={WEEKS}
        period={7}
        slots={DAYS}
        cycleUnit="weeks"
        title="Weekly shape"
        width={280}
        height={44}
      />
    </DemoPanel>
  );
}
