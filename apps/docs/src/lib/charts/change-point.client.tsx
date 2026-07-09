"use client";
import { ChangePoint as ChangePointInteractive } from "@microcharts/react/change-point/interactive";
import { DemoPanel } from "@/components/charts/demo-panel";
import { ERRORS } from "./change-point";

export function InteractiveDemo() {
  // ERRORS referenced inside the component — this module and its registry parent
  // import each other (temporal-dead-zone trap at build otherwise).
  return (
    <DemoPanel hint="Hover or arrow across the points — each announces its value and regime; Tab jumps between the breaks, announcing the mean shift.">
      <ChangePointInteractive
        data={ERRORS}
        label="delta"
        title="Error rate"
        width={280}
        height={30}
      />
    </DemoPanel>
  );
}
