"use client";
import { useState } from "react";
import { PictogramRow as PictogramRowInteractive } from "@microcharts/react/pictogram-row/interactive";
import { RotateCw } from "lucide-react";
import { DemoPanel } from "@/components/charts/demo-panel";

const STOPS = [3, 5, 6.5, 8];

export function InteractiveDemo() {
  const [i, setI] = useState(1);
  return (
    <DemoPanel
      hint="Step the count — each change announces the new figure politely."
      action={
        <button
          type="button"
          onClick={() => setI((n) => (n + 1) % STOPS.length)}
          aria-label="Change count"
          title="Change count"
          className="ghost-ctrl size-8"
        >
          <RotateCw className="size-4" />
        </button>
      }
    >
      <PictogramRowInteractive
        value={STOPS[i]!}
        total={8}
        title="Capacity used"
        width={220}
        height={26}
      />
    </DemoPanel>
  );
}
