"use client";
import { ControlStrip as ControlStripInteractive } from "@microcharts/react/control-strip/interactive";
import { DemoPanel } from "@/components/charts/demo-panel";
import { DEMO } from "./control-strip";

export function InteractiveDemo() {
  // DEMO referenced inside the component — this module and its registry parent
  // import each other (temporal-dead-zone trap at build otherwise).
  return (
    <DemoPanel hint="Hover or arrow across the points — out-of-control points announce which limit they crossed.">
      <ControlStripInteractive
        data={DEMO}
        rules="we"
        title="Line 3 fill weight"
        width={280}
        height={26}
      />
    </DemoPanel>
  );
}
