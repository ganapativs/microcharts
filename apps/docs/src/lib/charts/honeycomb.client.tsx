"use client";
import { useState } from "react";
import { Honeycomb as HoneycombInteractive } from "@microcharts/react/honeycomb/interactive";
import { DemoPanel } from "@/components/charts/demo-panel";

export function InteractiveDemo() {
  const [value, setValue] = useState(28);
  return (
    <DemoPanel hint="Tap to take another seat — the new count fills a cell and is announced through a polite live region. Hover reveals the value / total. The cells are anonymous units, so there is no per-cell cursor.">
      <button
        type="button"
        onClick={() => setValue((v) => (v >= 40 ? 0 : v + 1))}
        style={{ background: "none", border: "none", padding: 0, cursor: "pointer", lineHeight: 0 }}
        aria-label="Take a seat"
      >
        <HoneycombInteractive value={value} total={40} unit="seats" title="Occupancy" cellR={8} />
      </button>
    </DemoPanel>
  );
}
