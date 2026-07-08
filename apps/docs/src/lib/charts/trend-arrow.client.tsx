"use client";
import { useState } from "react";
import { TrendArrow as TrendArrowInteractive } from "@microcharts/react/trend-arrow/interactive";
import { RotateCw } from "lucide-react";
import { DemoPanel } from "@/components/charts/demo-panel";

const VALUES = [0.12, 0.02, -0.08];
const PCT = { style: "percent", maximumFractionDigits: 0 } as const;

export function InteractiveDemo() {
  const [i, setI] = useState(0);
  return (
    <DemoPanel
      hint="Cycle the value — direction changes pulse and re-announce politely."
      action={
        <button
          type="button"
          onClick={() => setI((n) => (n + 1) % VALUES.length)}
          aria-label="Change value"
          title="Change value"
          className="ghost-ctrl size-8"
        >
          <RotateCw className="size-4" />
        </button>
      }
    >
      <TrendArrowInteractive
        value={VALUES[i]!}
        showValue
        format={PCT}
        title="Weekly change"
        style={{ width: 96, height: 44 }}
      />
    </DemoPanel>
  );
}
