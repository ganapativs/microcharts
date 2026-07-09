"use client";
import { useEffect, useRef, useState } from "react";
import { CometTrail as CometTrailInteractive } from "@microcharts/react/comet-trail/interactive";
import { DemoPanel } from "@/components/charts/demo-panel";

export function InteractiveDemo() {
  const [data, setData] = useState<number[]>([50, 52, 48, 55, 60, 58, 62, 65, 63, 68, 70, 66]);
  const [running, setRunning] = useState(true);
  const seed = useRef(1);

  // A gentle random walk drives the head; each tick the comet re-forms toward the
  // new value. (Math.random is fine here — this is a client-only demo, not SSR.)
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setData((prev) => {
        seed.current = (seed.current * 1103515245 + 12345) & 0x7fffffff;
        const step = ((seed.current % 21) - 10) * 1.4;
        const next = Math.max(5, Math.min(95, (prev[prev.length - 1] ?? 50) + step));
        return [...prev.slice(-19), Math.round(next)];
      });
    }, 900);
    return () => clearInterval(id);
  }, [running]);

  return (
    <DemoPanel hint="A live rolling value. The bright head is now; the fading trail is where it has just been (opacity is age, never value). Each update eases the head to the new position — a steady stream makes the comet, a stall goes still. Reduced-motion readers get the same decaying dot-sparkline, repositioned instantly.">
      <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "flex-start" }}>
        <CometTrailInteractive data={data} title="Latency" width={260} height={44} />
        <button
          type="button"
          onClick={() => setRunning((r) => !r)}
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
          {running ? "pause" : "resume"}
        </button>
      </div>
    </DemoPanel>
  );
}
