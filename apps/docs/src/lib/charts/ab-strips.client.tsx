"use client";
import { ABStrips as ABStripsInteractive } from "@microcharts/react/ab-strips/interactive";
import { DemoPanel } from "@/components/charts/demo-panel";
import { A, B, MS } from "./ab-strips";

export function InteractiveDemo() {
  // A/B/MS referenced inside the component — this module and its registry parent
  // import each other (temporal-dead-zone trap at build otherwise).
  return (
    <DemoPanel hint="Hover or arrow (↑/↓ rows, ←/→ edges) — the median announces the delta vs the other arm; other edges announce the percentile.">
      <ABStripsInteractive
        data={{ a: A, b: B }}
        format={MS}
        positive="down"
        title="Latency A/B"
        width={280}
        height={26}
      />
    </DemoPanel>
  );
}
