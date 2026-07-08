"use client";
import { useState } from "react";
import { StatusDot as StatusDotInteractive } from "@microcharts/react/status-dot/interactive";
import { RotateCw } from "lucide-react";
import { DemoPanel } from "@/components/charts/demo-panel";

const CYCLE = ["ok", "busy", "warn", "error", "off"] as const;

export function InteractiveDemo() {
  const [i, setI] = useState(0);
  return (
    <DemoPanel
      hint="Cycle the state — each change is announced politely with its label."
      action={
        <button
          type="button"
          onClick={() => setI((n) => (n + 1) % CYCLE.length)}
          aria-label="Change state"
          title="Change state"
          className="ghost-ctrl size-8"
        >
          <RotateCw className="size-4" />
        </button>
      }
    >
      <span className="inline-flex items-center gap-3 text-lg">
        <StatusDotInteractive
          status={CYCLE[i]!}
          title="Deploys"
          style={{ width: 22, height: 22 }}
        />
        <span className="font-mono text-sm opacity-70">{CYCLE[i]}</span>
      </span>
    </DemoPanel>
  );
}
