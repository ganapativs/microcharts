"use client";
import { NetFlow as NetFlowInteractive } from "@microcharts/react/net-flow/interactive";
import { DemoPanel } from "@/components/charts/demo-panel";
import { DEMO, KFMT } from "./net-flow";

export function InteractiveDemo() {
  // DEMO/KFMT are referenced inside the component, never at module top level:
  // this module and its registry parent import each other (temporal-dead-zone
  // trap at static-export time otherwise — see plan/12).
  return (
    <DemoPanel hint="Hover or arrow across the months — each announces inflow, outflow, and the signed net.">
      <NetFlowInteractive
        data={DEMO}
        format={KFMT}
        label="last"
        title="Monthly cash flow"
        width={280}
        height={30}
      />
    </DemoPanel>
  );
}
