"use client";
import { QueueDepth as QueueDepthInteractive } from "@microcharts/react/queue-depth/interactive";
import { DemoPanel } from "@/components/charts/demo-panel";
import { DATA, CAP } from "./queue-depth";

export function InteractiveDemo() {
  // DATA/CAP referenced inside the component — this module and its registry
  // parent import each other (temporal-dead-zone trap at build otherwise).
  return (
    <DemoPanel hint="Hover or arrow across the periods — each announces the depth and whether it's above capacity.">
      <QueueDepthInteractive
        data={DATA}
        capacity={CAP}
        title="Support queue"
        width={280}
        height={30}
      />
    </DemoPanel>
  );
}
