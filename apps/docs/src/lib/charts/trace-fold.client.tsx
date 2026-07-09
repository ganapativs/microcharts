"use client";
import { TraceFold as TraceFoldInteractive } from "@microcharts/react/trace-fold/interactive";
import { DemoPanel } from "@/components/charts/demo-panel";
import { TRACE } from "./trace-fold";

const ms = (n: number) => `${Math.round(n)} ms`;

export function InteractiveDemo() {
  return (
    <DemoPanel hint="Hover, or use ←/→ within a depth and ↑/↓ between depths — each span announces its duration, share, and path status.">
      <TraceFoldInteractive
        data={TRACE}
        format={ms}
        title="Request trace"
        width={320}
        height={40}
      />
    </DemoPanel>
  );
}
