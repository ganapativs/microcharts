// Bench suite v2 (plan/07 §3, plan/21 §6.0.D). Reproducible numbers for the
// core kernel + static SSR render of EVERY chart, measured with perf_hooks
// (zero deps). Scenarios live in `bench/scenarios.mjs` — batches add one entry
// per chart; each is checked against its per-scenario SSR floor. Run after
// `pnpm build`:  node bench/run.mjs   → prints tables + writes results.json.
//
// Competitor matrix (Recharts/Chart.js/MUI X/uPlot/@fnando) is a separate,
// heavier harness (installs each lib in an isolated workspace) — deferred to
// launch prep in STATUS. This file establishes OUR baseline so every README
// number is reproducible from here (CLAUDE.md working rule).
import { performance } from "node:perf_hooks";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describeSeries } from "../dist/index.js";
import { SCENARIOS } from "./scenarios.mjs";

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

/** Median wall time over `reps` windows of `count` rendered rows (median, not
 *  first window — the first window pays JIT warmup and reads 3–4× slow). */
function renderScenario(Component, props, count, reps = 5) {
  let bytes = 0;
  const times = [];
  for (let r = 0; r < reps; r++) {
    bytes = 0;
    const t0 = performance.now();
    for (let i = 0; i < count; i++) {
      bytes += renderToStaticMarkup(h(Component, props(i))).length;
    }
    times.push(performance.now() - t0);
  }
  times.sort((a, b) => a - b);
  const ms = times[Math.floor(times.length / 2)];
  return {
    count,
    ms: +ms.toFixed(1),
    msPer: +(ms / count).toFixed(3),
    rowsPerMs: +(count / ms).toFixed(1),
    avgBytes: Math.round(bytes / count),
  };
}

// Resolve each scenario's component from the built dist (same artifact users get).
const resolved = [];
for (const s of SCENARIOS) {
  const mod = await import(`../dist/charts/${s.slug}/index.js`);
  const Component = mod[s.component];
  if (!Component) throw new Error(`bench: ${s.slug} does not export ${s.component}`);
  resolved.push({ ...s, Component });
}
// Two passes: warm EVERY component (renderToStaticMarkup + per-chart code paths
// go hot process-wide), then measure — otherwise the first chart reads 3–4× slow.
for (const s of resolved) renderScenario(s.Component, s.props, 300, 2);
const charts = resolved.map((s) => {
  const run = renderScenario(s.Component, s.props, 500);
  return { slug: s.slug, floor: s.floor, ...run, pass: run.rowsPerMs >= s.floor };
});

const core = [opsPerSec("describeSeries (24 pts)", () => describeSeries(DATA))];

// The published table scenario (N sparklines → SVG) — continuity with the
// docs' falsifiable numbers (apps/docs lib/stats.ts).
const sparkline = SCENARIOS.find((s) => s.slug === "sparkline");
const sparklineMod = await import("../dist/charts/sparkline/index.js");
const scenarios = [100, 500, 1000].map((n) =>
  renderScenario(sparklineMod[sparkline.component], sparkline.props, n),
);

console.log("\nmicrocharts bench v2 —", new Date().toISOString());
console.log("node", process.version, "\n");
console.log("core:");
for (const r of core)
  console.log(`  ${r.label.padEnd(26)} ${r.opsPerSec.toLocaleString().padStart(12)} ops/s`);
console.log("\nper-chart SSR (500 rows; per-scenario floors — see scenarios.mjs):");
for (const c of charts)
  console.log(
    `  ${c.slug.padEnd(14)} ${String(c.ms).padStart(7)} ms  ${String(c.rowsPerMs).padStart(7)} rows/ms (floor ${c.floor})  ~${c.avgBytes} B/row  ${c.pass ? "ok" : "BELOW FLOOR"}`,
  );
console.log("\nstatic SSR table scenario (N sparklines → SVG string):");
for (const s of scenarios)
  console.log(
    `  ${String(s.count).padStart(4)} rows  ${String(s.ms).padStart(8)} ms   ${s.msPer} ms/row   ~${s.avgBytes} B/row`,
  );
console.log("");

const results = {
  at: new Date().toISOString(),
  node: process.version,
  core,
  charts,
  scenarios,
};
writeFileSync(
  fileURLToPath(new URL("./results.json", import.meta.url)),
  JSON.stringify(results, null, 2),
);

if (charts.some((c) => !c.pass)) {
  console.error("bench: a chart is below the SSR floor — see table above.");
  process.exitCode = 1;
}
