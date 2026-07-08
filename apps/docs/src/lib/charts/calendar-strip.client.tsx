"use client";
import { CalendarStrip as CalendarStripInteractive } from "@microcharts/react/calendar-strip/interactive";
import { DemoPanel } from "@/components/charts/demo-panel";

const END = "2026-07-01";
const DATA = Array.from({ length: 18 }, (_, i) => ({
  date: `2026-06-${String(4 + i).padStart(2, "0")}`,
  value: i % 4 === 3 ? 0 : (i % 7) + 1,
}));

export function InteractiveDemo() {
  return (
    <DemoPanel hint="Hover a day or arrow through the grid (←/→ day, ↑/↓ week) — each announces its real calendar day.">
      <CalendarStripInteractive
        data={DATA}
        end={END}
        title="Deploy cadence"
        style={{ width: 180, height: 92 }}
      />
    </DemoPanel>
  );
}
