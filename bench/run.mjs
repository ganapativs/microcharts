// Bench suite v1 (plan/07 §3, plan/10 2.8). Reproducible numbers for the core
// kernel + static SSR render, measured with perf_hooks (zero deps). Run after
// `pnpm build`:  node bench/run.mjs   → prints a table + writes results.json.
//
// Competitor matrix (Recharts/Chart.js/MUI X/uPlot/@fnando) is a separate,
// heavier harness (installs each lib in an isolated workspace) — tracked in
// STATUS as bench follow-up. This file establishes OUR baseline so every README
// number is reproducible from here (CLAUDE.md working rule).
import { performance } from "node:perf_hooks";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describeSeries } from "../dist/index.js";
import { Sparkline } from "../dist/charts/sparkline/index.js";
import { SparkBar } from "../dist/charts/sparkbar/index.js";

const DATA = Array.from({ length: 24 }, (_, i) => Math.sin(i / 3) * 10 + i);

/** Median ops/sec over `reps` timed windows of `batch` calls each. */
function opsPerSec(label, fn, { batch = 1000, reps = 30, warmup = 5 } = {}) {
  for (let w = 0; w < warmup; w++) for (let i = 0; i < batch; i++) fn(i);
  const rates = [];
  for (let r = 0; r < reps; r++) {
    const t0 = performance.now();
    for (let i = 0; i < batch; i++) fn(i);
    const dt = performance.now() - t0;
    rates.push((batch / dt) * 1000);
  }
  rates.sort((a, b) => a - b);
  const median = rates[Math.floor(rates.length / 2)];
  return { label, opsPerSec: Math.round(median) };
}

/** Wall time to render `count` sparklines to static SVG markup. */
function renderScenario(count) {
  const t0 = performance.now();
  let bytes = 0;
  for (let i = 0; i < count; i++) {
    const shifted = DATA.map((v, j) => v + ((i + j) % 7));
    bytes += renderToStaticMarkup(h(Sparkline, { data: shifted, summary: false })).length;
  }
  const ms = performance.now() - t0;
  return {
    count,
    ms: +ms.toFixed(1),
    msPer: +(ms / count).toFixed(3),
    avgBytes: Math.round(bytes / count),
  };
}

const core = [
  opsPerSec("describeSeries (24 pts)", () => describeSeries(DATA)),
  opsPerSec(
    "Sparkline SSR (24 pts)",
    () => renderToStaticMarkup(h(Sparkline, { data: DATA, summary: false })),
    { batch: 200 },
  ),
  opsPerSec(
    "SparkBar SSR (24 pts)",
    () => renderToStaticMarkup(h(SparkBar, { data: DATA, summary: false })),
    { batch: 200 },
  ),
];

const scenarios = [renderScenario(100), renderScenario(500), renderScenario(1000)];

console.log("\nmicrocharts bench v1 —", new Date().toISOString());
console.log("node", process.version, "\n");
console.log("core / render throughput:");
for (const r of core)
  console.log(`  ${r.label.padEnd(26)} ${r.opsPerSec.toLocaleString().padStart(12)} ops/s`);
console.log("\nstatic SSR table scenario (N sparklines → SVG string):");
for (const s of scenarios)
  console.log(
    `  ${String(s.count).padStart(4)} rows  ${String(s.ms).padStart(8)} ms   ${s.msPer} ms/row   ~${s.avgBytes} B/row`,
  );
console.log("");

const results = { at: new Date().toISOString(), node: process.version, core, scenarios };
writeFileSync(
  fileURLToPath(new URL("./results.json", import.meta.url)),
  JSON.stringify(results, null, 2),
);
