"use client";
import { useEffect, useState } from "react";
import { EtaBar as EtaBarInteractive } from "@microcharts/react/eta-bar/interactive";
import { DemoPanel } from "@/components/charts/demo-panel";

const min = (t: number) => `${Math.round(t)} min`;

export function InteractiveDemo() {
  // a gently advancing transfer whose rate dips mid-way — watch the ETA re-forecast
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((n) => (n + 1) % 40), 900);
    return () => clearInterval(id);
  }, []);
  const progress = Math.min(0.98, 0.05 + i * 0.024);
  const rate = i > 18 && i < 30 ? 0.006 : 0.02;
  return (
    <DemoPanel hint="A live transfer — when the rate dips, the remainder honestly grows. Focus reads the forecast.">
      <EtaBarInteractive
        progress={progress}
        elapsed={i + 1}
        rate={rate}
        formatEta={min}
        announceEvery={4000}
        title="Export"
        width={300}
        height={16}
      />
    </DemoPanel>
  );
}
