"use client";
import { useState } from "react";
import { Constellation as ConstellationInteractive } from "@microcharts/react/constellation/interactive";
import { DemoPanel } from "@/components/charts/demo-panel";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"];
const monthFmt = (x: number) => MONTHS[x] ?? String(x);

const INCIDENTS = [
  { x: 0, y: 40, m: 2 },
  { x: 2, y: 90, m: 7 },
  { x: 5, y: 30, m: 3 },
  { x: 8, y: 65, m: 5 },
];

export function InteractiveDemo() {
  const [connect, setConnect] = useState(true);
  return (
    <DemoPanel hint="Hover or focus and arrow through the events chronologically — each announces its time, value, and magnitude through a polite live region. The connector is chronology only; toggle it off for a pure scatter.">
      <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "flex-start" }}>
        <ConstellationInteractive
          data={INCIDENTS}
          connect={connect}
          xFormat={monthFmt}
          title="Incidents"
          width={180}
          height={48}
        />
        <button
          type="button"
          onClick={() => setConnect((c) => !c)}
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
          connect: {connect ? "on" : "off"}
        </button>
      </div>
    </DemoPanel>
  );
}
