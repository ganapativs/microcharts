"use client";
import { useEffect, useRef, useState } from "react";
import { OrbitStatus as OrbitStatusInteractive } from "@microcharts/react/orbit-status/interactive";
import { DemoPanel } from "@/components/charts/demo-panel";

// A tiny fleet of dependencies, each drifting on its own random walk.
const SERVICES = ["auth", "payments", "search"];

export function InteractiveDemo() {
  const [rows, setRows] = useState(
    SERVICES.map((name, i) => ({ name, latency: 120 + i * 80, rate: 14 - i * 4 })),
  );
  const seed = useRef(7);

  useEffect(() => {
    const id = setInterval(() => {
      setRows((prev) =>
        prev.map((r) => {
          seed.current = (seed.current * 1103515245 + 12345) & 0x7fffffff;
          const dl = ((seed.current % 21) - 10) * 8;
          seed.current = (seed.current * 1103515245 + 12345) & 0x7fffffff;
          const dr = (seed.current % 7) - 3;
          return {
            ...r,
            latency: Math.max(20, Math.min(480, r.latency + dl)),
            rate: Math.max(0, Math.min(20, r.rate + dr)),
          };
        }),
      );
    }, 1400);
    return () => clearInterval(id);
  }, []);

  return (
    <DemoPanel hint="A live dependency table. Each orbit's radius is its latency, its dash density is its call rate, and the satellite's speed mirrors that rate — busier services spin faster. Cross 300ms and the satellite doubles and the row flags. Reduced-motion readers read the same dash density without the spin.">
      <table style={{ borderCollapse: "collapse", font: "13px ui-monospace, monospace" }}>
        <tbody>
          {rows.map((r) => (
            <tr key={r.name}>
              <td style={{ padding: "6px 14px 6px 0", opacity: 0.75 }}>{r.name}</td>
              <td style={{ padding: "6px 0" }}>
                <OrbitStatusInteractive
                  latency={r.latency}
                  rate={r.rate}
                  latencyDomain={[0, 500]}
                  rateDomain={[0, 20]}
                  alert={300}
                  label="latency"
                  title={r.name}
                  size={30}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </DemoPanel>
  );
}
