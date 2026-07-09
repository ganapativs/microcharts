"use client";
import { useState } from "react";
import { BreathingDot as BreathingDotInteractive } from "@microcharts/react/breathing-dot/interactive";
import { DemoPanel } from "@/components/charts/demo-panel";

export function InteractiveDemo() {
  const [pct, setPct] = useState(42);
  return (
    <DemoPanel hint="Drag the load up and down — the dot pulses faster and larger as it moves through the calm, elevated, and strained bands. The motion is the encoding, so a reduced-motion reader gets the static ring offset instead, and the band is announced through a polite live region only when it changes.">
      <div style={{ display: "flex", flexDirection: "column", gap: 14, alignItems: "center" }}>
        <BreathingDotInteractive value={pct / 100} title="Load" size={96} />
        <input
          type="range"
          min={0}
          max={100}
          value={pct}
          onChange={(e) => setPct(Number(e.target.value))}
          aria-label="Load level"
          style={{ width: 200 }}
        />
        <span style={{ font: "12px ui-monospace, monospace", opacity: 0.7 }}>
          value={(pct / 100).toFixed(2)}
        </span>
      </div>
    </DemoPanel>
  );
}
