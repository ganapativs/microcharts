"use client";
import { useState } from "react";
import { BalanceBeam as BalanceBeamInteractive } from "@microcharts/react/balance-beam/interactive";
import { DemoPanel } from "@/components/charts/demo-panel";

const PAIRS: [number, number][] = [
  [620, 480],
  [500, 500],
  [400, 700],
  [820, 300],
];

export function InteractiveDemo() {
  const [i, setI] = useState(0);
  const [l, r] = PAIRS[i]!;
  return (
    <DemoPanel hint="Tap to change the weights — the beam eases to its new tilt (reduced-motion → it jumps), hover or arrow a side to read its value, and a flip of the heavier side is announced.">
      <button
        type="button"
        onClick={() => setI((v) => (v + 1) % PAIRS.length)}
        style={{ background: "none", border: "none", padding: 0, cursor: "pointer", lineHeight: 0 }}
        aria-label="Change the weights"
      >
        <BalanceBeamInteractive
          data={[
            { label: "Inflow", value: l },
            { label: "Outflow", value: r },
          ]}
          label="values"
          title="Cash flow"
          width={130}
          height={48}
        />
      </button>
    </DemoPanel>
  );
}
