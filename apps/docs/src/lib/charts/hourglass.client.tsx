"use client";
import { useState } from "react";
import { Hourglass as HourglassInteractive } from "@microcharts/react/hourglass/interactive";
import { DemoPanel } from "@/components/charts/demo-panel";

const STEPS = [0.1, 0.35, 0.55, 0.75, 0.95, 1];

export function InteractiveDemo() {
  const [i, setI] = useState(2);
  return (
    <DemoPanel hint="Tap to let more sand fall — the levels cross-fade (reduced-motion → they swap), and the total is announced only when it crosses a documented threshold (50 / 90 / 100%), never on every tick.">
      <button
        type="button"
        onClick={() => setI((v) => (v + 1) % STEPS.length)}
        style={{ background: "none", border: "none", padding: 0, cursor: "pointer", lineHeight: 0 }}
        aria-label="Let more sand fall"
      >
        <HourglassInteractive value={STEPS[i]!} label="remaining" title="Session" height={60} />
      </button>
    </DemoPanel>
  );
}
