"use client";
import { useState } from "react";
import { Delta as DeltaInteractive } from "@microcharts/react/delta/interactive";
import { RotateCw } from "lucide-react";
import { DemoPanel } from "@/components/charts/demo-panel";

/**
 * Delta's interactive demo owns state (the shuffle action re-announces the
 * value), so it lives behind its own client boundary — the registry module
 * stays importable from server components (gallery, machine surfaces).
 */
export function InteractiveDemo() {
  const [value, setValue] = useState(0.184);
  return (
    <DemoPanel
      hint="Shuffle the value — it re-announces politely to screen readers."
      action={
        <button
          type="button"
          onClick={() => setValue((v) => (v > 0 ? -0.062 : 0.184))}
          aria-label="Change value"
          title="Change value"
          className="ghost-ctrl size-8"
        >
          <RotateCw className="size-4" />
        </button>
      }
    >
      <span className="text-3xl">
        <DeltaInteractive value={value} title="Growth vs last week" live />
      </span>
    </DemoPanel>
  );
}
