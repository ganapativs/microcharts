"use client";
import { useState } from "react";
import { Progress as ProgressInteractive } from "@microcharts/react/progress/interactive";
import { RotateCw } from "lucide-react";
import { DemoPanel } from "@/components/charts/demo-panel";

const STOPS = [0.24, 0.51, 0.68, 0.92];

export function InteractiveDemo() {
  const [i, setI] = useState(2);
  return (
    <DemoPanel
      hint="Step the value — the fill glides and whole-percent changes announce politely."
      action={
        <button
          type="button"
          onClick={() => setI((n) => (n + 1) % STOPS.length)}
          aria-label="Advance progress"
          title="Advance progress"
          className="ghost-ctrl size-8"
        >
          <RotateCw className="size-4" />
        </button>
      }
    >
      <ProgressInteractive value={STOPS[i]!} title="Upload" width={200} height={26} />
    </DemoPanel>
  );
}
