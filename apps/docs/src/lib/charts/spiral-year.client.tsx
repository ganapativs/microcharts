"use client";
import { useState } from "react";
import { SpiralYear as SpiralYearInteractive } from "@microcharts/react/spiral-year/interactive";
import { DemoPanel } from "@/components/charts/demo-panel";

const YEAR = Array.from({ length: 52 }, (_, i) => {
  const seasonal = Math.round(200 + 140 * Math.sin(((i - 8) / 52) * Math.PI * 2));
  return i === 29 ? 480 : seasonal;
});

export function InteractiveDemo() {
  const [mark, setMark] = useState<"dot" | "arc">("dot");
  return (
    <DemoPanel hint="Hover across the spiral or arrow along it week by week — each mark announces its period and value through a polite live region. Remember the channel is ordinal opacity: for an exact day, reach for ActivityGrid or HeatStrip.">
      <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "flex-start" }}>
        <SpiralYearInteractive data={YEAR} mark={mark} title="Seasonality" size={132} />
        <button
          type="button"
          onClick={() => setMark((m) => (m === "dot" ? "arc" : "dot"))}
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
          mark: {mark}
        </button>
      </div>
    </DemoPanel>
  );
}
