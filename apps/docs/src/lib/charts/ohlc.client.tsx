"use client";
import { Ohlc as OhlcInteractive } from "@microcharts/react/ohlc/interactive";
import { DemoPanel } from "@/components/charts/demo-panel";

const PERIODS = Array.from({ length: 20 }, (_, i) => {
  const base = 140 + Math.sin(i / 3) * 8 + i * 0.6;
  return {
    open: Math.round(base * 10) / 10,
    high: Math.round((base + 3 + (i % 3)) * 10) / 10,
    low: Math.round((base - 3 - (i % 2)) * 10) / 10,
    close: Math.round((base + (i % 2 === 0 ? 2 : -1.5)) * 10) / 10,
  };
});

export function InteractiveDemo() {
  return (
    <DemoPanel hint="Hover or arrow through the sessions — each announces open, high, low, and close.">
      <OhlcInteractive data={PERIODS} title="ACME 20 sessions" style={{ width: 280, height: 32 }} />
    </DemoPanel>
  );
}
