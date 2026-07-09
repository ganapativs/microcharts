"use client";
import { useState } from "react";
import { PolarClock as PolarClockInteractive } from "@microcharts/react/polar-clock/interactive";
import { DemoPanel } from "@/components/charts/demo-panel";

const DAY = Array.from({ length: 24 }, (_, h) => (h === 14 ? 312 : h === 4 ? 20 : 80 + h));

export function InteractiveDemo() {
  const [mode, setMode] = useState<"length" | "opacity">("length");
  return (
    <DemoPanel hint="Hover around the face or arrow through the hours — each segment announces its time and value through a polite live region, and the cursor lifts the segment under it to the accent. Switch to opacity mode to read value as fill instead of length.">
      <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "flex-start" }}>
        <PolarClockInteractive data={DAY} now={14} mode={mode} title="Traffic by hour" size={128} />
        <button
          type="button"
          onClick={() => setMode((m) => (m === "length" ? "opacity" : "length"))}
          style={{
            font: "12px ui-monospace, monospace",
            padding: "4px 10px",
            borderRadius: 6,
            border: "1px solid var(--color-fd-border)",
            background: "none",
            cursor: "pointer",
            color: "inherit",
          }}
        >
          mode: {mode}
        </button>
      </div>
    </DemoPanel>
  );
}
