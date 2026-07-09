"use client";
import { useEffect, useRef, useState } from "react";
import { HeartbeatBlip as HeartbeatBlipInteractive } from "@microcharts/react/heartbeat-blip/interactive";
import { DemoPanel } from "@/components/charts/demo-panel";

export function InteractiveDemo() {
  const [events, setEvents] = useState<number[]>([]);
  const [now, setNow] = useState(0);
  const [firing, setFiring] = useState(true);
  const clock = useRef(0);

  // A self-contained clock (no Date.now — keeps the demo deterministic-ish and
  // hydration-safe): advance ~4x/sec, occasionally emitting an event.
  useEffect(() => {
    const id = setInterval(() => {
      clock.current += 250;
      setNow(clock.current);
      if (firing && clock.current % 1000 === 0 && (clock.current / 1000) % 3 !== 0) {
        setEvents((prev) => [...prev.slice(-40), clock.current]);
      }
    }, 250);
    return () => clearInterval(id);
  }, [firing]);

  return (
    <DemoPanel hint="A live event firehose. Each blip is one real event arriving; the trace sweeps left as time passes and the rate you see IS the event rate. Stop the firehose and, after the window empties, the flat baseline is the down signal — never a fake pulse. Reduced-motion readers get the same trace, re-rendered on each event instead of swept.">
      <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "flex-start" }}>
        <HeartbeatBlipInteractive
          data={events}
          now={now}
          window={20_000}
          label="count"
          title="Requests"
          width={280}
          height={40}
        />
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" onClick={() => setFiring((f) => !f)} style={btn}>
            {firing ? "stop firehose" : "start firehose"}
          </button>
          <button
            type="button"
            onClick={() => setEvents((p) => [...p.slice(-40), now])}
            style={btn}
          >
            fire one
          </button>
        </div>
      </div>
    </DemoPanel>
  );
}

const btn: React.CSSProperties = {
  font: "12px ui-monospace, monospace",
  padding: "4px 10px",
  borderRadius: 6,
  border: "1px solid var(--color-fd-border)",
  background: "none",
  cursor: "pointer",
  color: "inherit",
};
