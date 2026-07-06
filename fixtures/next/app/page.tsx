// Server Component (no 'use client'). Everything here — including the chart —
// renders to static HTML on the server.
import { Sparkline } from "./Sparkline";

const revenue = [3, 5, 4, 8, 6, 9, 7, 10, 8, 12];

export default function Page() {
  return (
    <main style={{ font: "15px/1.6 system-ui, sans-serif", padding: 32 }}>
      <h1>microcharts — RSC static</h1>
      <p>
        Weekly revenue <Sparkline data={revenue} title="Weekly revenue" /> trending up.
      </p>
    </main>
  );
}
