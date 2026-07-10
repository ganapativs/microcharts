"use client";
import { SpreadBand as SpreadBandInteractive } from "@microcharts/react/spread-band/interactive";
import { DemoPanel } from "@/components/charts/demo-panel";

const ORG = [8, 9, 11, 12, 14, 15, 17, 18, 20, 21, 23, 24];
const PAID = [12, 12, 13, 13, 13, 14, 14, 14, 15, 15, 16, 16];
const PAIRS = ORG.map((a, i) => ({ a, b: PAID[i]! }));

export function InteractiveDemo() {
  return (
    <DemoPanel hint="Hover or arrow across — each point announces who leads and by how much.">
      <SpreadBandInteractive
        data={PAIRS}
        labels={["Organic", "Paid"]}
        title="Organic vs paid"
        width={280}
        height={34}
      />
    </DemoPanel>
  );
}
