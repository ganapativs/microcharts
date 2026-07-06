// Hand-assembled sparkline for Checkpoint 1 (plan/10 §1): composes the REAL
// shipped shell — <Chart> + describeSeries from @microcharts/react — with inline
// scale/path. No hooks, no 'use client' → renders entirely on the server as a
// React Server Component, shipping zero client JS. The full <Sparkline> (Phase
// 2) will encapsulate this same composition using the internal core kernel.
import { Chart, describeSeries } from "@microcharts/react";

export interface SparklineProps {
  data: readonly number[];
  width?: number;
  height?: number;
  title?: string;
}

export function Sparkline({ data, width = 80, height = 24, title }: SparklineProps) {
  const pad = 2;
  const finite = data.filter((v): v is number => Number.isFinite(v));
  const min = Math.min(...finite);
  const max = Math.max(...finite);
  const span = max - min || 1;
  const n = data.length;
  const dx = n > 1 ? (width - pad * 2) / (n - 1) : 0;
  const y = (v: number) => (height - pad - ((v - min) / span) * (height - pad * 2)).toFixed(2);

  const d = data
    .map((v, i) => `${i === 0 ? "M" : "L"}${(pad + i * dx).toFixed(2)} ${y(v)}`)
    .join(" ");

  const last = finite.at(-1);
  const lastX = (pad + (n - 1) * dx).toFixed(2);

  return (
    <Chart width={width} height={height} title={title} summary={describeSeries(data)}>
      <path d={d} vectorEffect="non-scaling-stroke" data-mc-ink="data" />
      {last !== undefined ? <circle cx={lastX} cy={y(last)} r={2} data-mc-ink="accent" /> : null}
    </Chart>
  );
}
