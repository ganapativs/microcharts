"use client";
import { useState } from "react";
import { ProgressRing as ProgressRingInteractive } from "@microcharts/react/progress-ring/interactive";
import { RotateCw } from "lucide-react";
import { DemoPanel } from "@/components/charts/demo-panel";

const STOPS = [0.2, 0.45, 0.7, 0.95, 1];

export function InteractiveDemo() {
  const [i, setI] = useState(0);
  return (
    <DemoPanel
      hint="Advance the ring — it announces only at quarter-threshold crossings (no spam)."
      action={
        <button
          type="button"
          onClick={() => setI((n) => (n + 1) % STOPS.length)}
          aria-label="Advance"
          title="Advance"
          className="ghost-ctrl size-8"
        >
          <RotateCw className="size-4" />
        </button>
      }
    >
      <ProgressRingInteractive
        value={STOPS[i]!}
        label="percent"
        size={48}
        title="Backup"
        style={{ width: 72, height: 72 }}
      />
    </DemoPanel>
  );
}
