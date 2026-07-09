"use client";
import { useState } from "react";
import { MoonPhase as MoonPhaseInteractive } from "@microcharts/react/moon-phase/interactive";
import { DemoPanel } from "@/components/charts/demo-panel";

const STEPS = [0.05, 0.25, 0.5, 0.75, 0.95];

export function InteractiveDemo() {
  const [i, setI] = useState(2);
  return (
    <DemoPanel hint="Tap to advance the phase — the lit region cross-fades to its new area (reduced-motion → it swaps), hover reveals the percent, and each change is announced through a polite live region.">
      <button
        type="button"
        onClick={() => setI((v) => (v + 1) % STEPS.length)}
        style={{ background: "none", border: "none", padding: 0, cursor: "pointer", lineHeight: 0 }}
        aria-label="Advance the phase"
      >
        <MoonPhaseInteractive value={STEPS[i]!} title="Sprint" size={40} />
      </button>
    </DemoPanel>
  );
}
