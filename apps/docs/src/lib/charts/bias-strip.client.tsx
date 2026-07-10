"use client";
import { BiasStrip as BiasStripInteractive } from "@microcharts/react/bias-strip/interactive";
import { DemoPanel } from "@/components/charts/demo-panel";

const DIFFS = [
  1.8, 2.4, 1.5, 2.9, 2.1, 1.2, 2.6, 3.0, 1.9, 2.3, 6.5, 2.0, 1.7, 2.8, 2.2, -1.5, 2.5, 1.6, 2.7,
  2.0,
];
const PAIRS = DIFFS.map((d, i) => ({ a: i + d, b: i }));

export function InteractiveDemo() {
  return (
    <DemoPanel hint="Hover the nearest pair or step by mean with ←/→ — each announces its mean, difference, and whether it clears the limits.">
      <BiasStripInteractive data={PAIRS} title="Device vs reference" width={220} height={120} />
    </DemoPanel>
  );
}
