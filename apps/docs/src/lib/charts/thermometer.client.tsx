"use client";
import { useState } from "react";
import { Thermometer as ThermometerInteractive } from "@microcharts/react/thermometer/interactive";
import { DemoPanel } from "@/components/charts/demo-panel";

const STEPS = [20, 45, 60, 78, 92];

export function InteractiveDemo() {
  const [i, setI] = useState(1);
  return (
    <DemoPanel hint="Tap to raise the level — the fill glides to its new reading (reduced-motion → it jumps), hover reveals the exact value, and each change is announced against the calibrated scale and target.">
      <button
        type="button"
        onClick={() => setI((v) => (v + 1) % STEPS.length)}
        style={{ background: "none", border: "none", padding: 0, cursor: "pointer", lineHeight: 0 }}
        aria-label="Raise the level"
      >
        <ThermometerInteractive value={STEPS[i]!} target={80} title="Fundraiser" height={64} />
      </button>
    </DemoPanel>
  );
}
