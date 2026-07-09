"use client";
import { useState } from "react";
import { FatDigits as FatDigitsInteractive } from "@microcharts/react/fat-digits/interactive";
import { DemoPanel } from "@/components/charts/demo-panel";

const STEPS = [76, 318, 942, 1204, 2100];

export function InteractiveDemo() {
  const [i, setI] = useState(3);
  return (
    <DemoPanel hint="Tap to change the value — the numeral stays exact while its weight eases to the new tier (on variable fonts; it snaps otherwise). The value and tier are announced through a polite live region.">
      <button
        type="button"
        onClick={() => setI((v) => (v + 1) % STEPS.length)}
        style={{ background: "none", border: "none", padding: 0, cursor: "pointer", lineHeight: 0 }}
        aria-label="Change the value"
      >
        <FatDigitsInteractive value={STEPS[i]!} domain={[0, 2100]} title="Revenue" fontSize={30} />
      </button>
    </DemoPanel>
  );
}
