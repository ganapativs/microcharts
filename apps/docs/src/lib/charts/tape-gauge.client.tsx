"use client";
import { useEffect, useState } from "react";
import { TapeGauge as TapeGaugeInteractive } from "@microcharts/react/tape-gauge/interactive";
import { DemoPanel } from "@/components/charts/demo-panel";
import { ZONES } from "./tape-gauge";

// A gentle scripted drift so the live entry reads as *live* in the docs —
// reduced-motion users see a still gauge (the interval is paused).
export function InteractiveDemo() {
  const [value, setValue] = useState(142);
  const [rate, setRate] = useState(1);
  useEffect(() => {
    if (typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches)
      return;
    const id = setInterval(() => {
      setValue((v) => {
        const next = v + (Math.random() * 2 - 0.8);
        const clamped = Math.max(108, Math.min(188, next));
        setRate(Number((clamped - v).toFixed(1)));
        return Number(clamped.toFixed(1));
      });
    }, 1400);
    return () => clearInterval(id);
  }, []);

  return (
    <DemoPanel hint="A live reading: the scale scrolls while the value stays parked at the pointer; chevrons show how fast it's moving, and each change is announced politely.">
      <TapeGaugeInteractive
        value={value}
        rate={rate}
        zones={ZONES}
        span={60}
        title="Airspeed"
        width={28}
        height={80}
      />
    </DemoPanel>
  );
}
