"use client";
import { QuadrantDot as QuadrantDotInteractive } from "@microcharts/react/quadrant-dot/interactive";
import { DemoPanel } from "@/components/charts/demo-panel";
import { FOCAL, FIELD } from "./quadrant-dot";

export function InteractiveDemo() {
  // FOCAL/FIELD referenced inside the component — this module and its registry
  // parent import each other (temporal-dead-zone trap at build otherwise).
  return (
    <DemoPanel hint="Hover or arrow across the peers — each announces its coords and quadrant, nearest-first from the focal dot.">
      <QuadrantDotInteractive
        data={FOCAL}
        field={FIELD}
        xDomain={[0, 10]}
        domain={[0, 10]}
        xLabel="effort"
        yLabel="impact"
        title="Effort vs impact"
        width={140}
        height={140}
      />
    </DemoPanel>
  );
}
