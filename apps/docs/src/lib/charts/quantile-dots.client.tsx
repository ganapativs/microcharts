"use client";
import { QuantileDots as QuantileDotsInteractive } from "@microcharts/react/quantile-dots/interactive";
import { DemoPanel } from "@/components/charts/demo-panel";
import { WAITS, MIN_FMT } from "./quantile-dots";

export function InteractiveDemo() {
  // WAITS/MIN_FMT referenced inside the component — this module and its registry
  // parent import each other (temporal-dead-zone trap at build otherwise).
  return (
    <DemoPanel hint="Hover to drag the threshold — the count of dots past the line recomputes as you move it.">
      <QuantileDotsInteractive
        data={WAITS}
        threshold={15}
        format={MIN_FMT}
        title="Bus wait"
        width={280}
        height={30}
      />
    </DemoPanel>
  );
}
