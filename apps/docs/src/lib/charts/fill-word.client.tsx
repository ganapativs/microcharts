"use client";
import { useState } from "react";
import { FillWord as FillWordInteractive } from "@microcharts/react/fill-word/interactive";
import { DemoPanel } from "@/components/charts/demo-panel";

export function InteractiveDemo() {
  const [value, setValue] = useState(0.25);
  return (
    <DemoPanel hint="Tap to advance — the accent ink edge glides along the word (reduced-motion → it jumps) and the new percentage is announced through a polite live region, throttled so a streaming value never spams.">
      <button
        type="button"
        onClick={() =>
          setValue((v) => (v >= 1 ? 0 : Math.min(1, Math.round((v + 0.2) * 100) / 100)))
        }
        style={{ background: "none", border: "none", padding: 0, cursor: "pointer", lineHeight: 0 }}
        aria-label="Advance the upload"
      >
        <FillWordInteractive word="uploading" value={value} title="Upload" fontSize={20} />
      </button>
    </DemoPanel>
  );
}
