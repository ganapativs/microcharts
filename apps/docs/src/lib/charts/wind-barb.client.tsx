"use client";
// WindBarb has no interactive entry — a single glyph carries the full reading.
// The "demo" is a compass of directions + a magnitude ladder, so the read-back
// key ("each barb = 10") is visible at a glance.
import { WindBarb } from "@microcharts/react/wind-barb";
import { DemoPanel } from "@/components/charts/demo-panel";

const DIRS = [0, 45, 90, 135, 180, 225, 270, 315];
const MAGS = [5, 15, 32, 55, 80];

export function InteractiveDemo() {
  return (
    <DemoPanel hint="No interaction needed — the glyph is the reading. Each full barb = 10; a pennant = 50.">
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem", alignItems: "center" }}>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "center" }}>
          {DIRS.map((d) => (
            <WindBarb
              key={d}
              direction={d}
              magnitude={35}
              title={`${d}°`}
              size={40}
              summary={false}
            />
          ))}
        </div>
        <div
          style={{
            display: "flex",
            gap: "0.75rem",
            flexWrap: "wrap",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {MAGS.map((m) => (
            <WindBarb
              key={m}
              direction={90}
              magnitude={m}
              label="value"
              title={`${m}`}
              size={44}
              summary={false}
            />
          ))}
        </div>
      </div>
    </DemoPanel>
  );
}
