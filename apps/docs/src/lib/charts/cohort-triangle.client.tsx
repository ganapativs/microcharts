"use client";
import { CohortTriangle as CohortTriangleInteractive } from "@microcharts/react/cohort-triangle/interactive";
import { DemoPanel } from "@/components/charts/demo-panel";
import { COHORTS } from "./cohort-triangle";

export function InteractiveDemo() {
  // COHORTS referenced inside the component — this module and its registry
  // parent import each other (temporal-dead-zone trap at build otherwise).
  return (
    <DemoPanel hint="Hover a cell, or focus and move in 2-D with the arrow keys — each cell announces its cohort, age, and retention.">
      <CohortTriangleInteractive data={COHORTS} cell={16} unit="month" title="Retention cohorts" />
    </DemoPanel>
  );
}
