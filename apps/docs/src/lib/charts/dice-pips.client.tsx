"use client";
import { useState } from "react";
import { DicePips as DicePipsInteractive } from "@microcharts/react/dice-pips/interactive";
import { DemoPanel } from "@/components/charts/demo-panel";

export function InteractiveDemo() {
  const [value, setValue] = useState(3);
  return (
    <DemoPanel hint="Tap to roll — the pip set cross-fades to the new face and the value is announced through a polite live region. The pips are one value, so there is no cursor to move.">
      <button
        type="button"
        onClick={() => setValue((v) => (v >= 6 ? 1 : v + 1))}
        style={{ background: "none", border: "none", padding: 0, cursor: "pointer", lineHeight: 0 }}
        aria-label="Roll the die"
      >
        <DicePipsInteractive value={value} title="Roll" size={40} />
      </button>
    </DemoPanel>
  );
}
