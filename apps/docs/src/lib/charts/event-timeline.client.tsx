"use client";
import { EventTimeline as EventTimelineInteractive } from "@microcharts/react/event-timeline/interactive";
import { DemoPanel } from "@/components/charts/demo-panel";

const H = 3_600_000;
const T0 = Date.UTC(2026, 5, 3);
const DATA = [
  { start: T0 + 1 * H, end: T0 + 5 * H, label: "Freeze", kind: "accent" as const },
  { start: T0 + 6 * H, end: T0 + 15 * H, label: "Healthy", kind: "positive" as const },
  { start: T0 + 11 * H, label: "Incident", kind: "negative" as const },
  { start: T0 + 16 * H, end: T0 + 18 * H, kind: "negative" as const },
  { start: T0 + 20 * H, label: "Release" },
];
const WINDOW: [number, number] = [T0, T0 + 24 * H];

export function InteractiveDemo() {
  return (
    <DemoPanel hint="Hover an item or arrow chronologically — spans announce their interval and duration, instants their moment.">
      <EventTimelineInteractive
        data={DATA}
        domain={WINDOW}
        title="API uptime"
        style={{ width: 280, height: 36 }}
      />
    </DemoPanel>
  );
}
