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

/**
 * Best ops/sec over `reps` timed windows of `batch` calls each.
 *
 * BEST, not median — same reasoning as `renderScenario` below. This runs after
 * every chart has been rendered many times, so the process is full of garbage
 * and the shared call sites are megamorphic; a median over that state measured
 * 816k, 800k and 572k ops/s on three consecutive runs of identical code (a 43%
 * spread), which is not a number you can publish. Throughput noise is one-sided
 * — GC and preemption only ever slow a window — so the fastest window is the
 * honest estimate of the code's own cost.
 */
function opsPerSec(label, fn, { batch = 1000, reps = 30, warmup = 5 } = {}) {
  for (let w = 0; w < warmup; w++) for (let i = 0; i < batch; i++) fn(i);
  let best = 0;
  for (let r = 0; r < reps; r++) {
    const t0 = performance.now();
    for (let i = 0; i < batch; i++) fn(i);
    const dt = performance.now() - t0;
    best = Math.max(best, (batch / dt) * 1000);
  }
  return { label, opsPerSec: Math.round(best) };
}

/**
 * Best wall time over `reps` windows of `count` rendered rows, after warming
 * THIS component.
 *
 * Two rules earn their keep here — without them the numbers are bimodal and the
 * floors below become a coin-flip gate (heat-cell measured 140 and 35 rows/ms on
 * consecutive runs of identical code):
 *
 *  1. Warm the component being measured, immediately before measuring it. A
 *     single global pre-pass over all 106 charts does NOT hold: by the time the
 *     last chart is timed, the render path has seen a hundred other component
 *     shapes and this one is cold again.
 *  2. Take the BEST window, not the median. Throughput noise is one-sided — GC
 *     pauses and scheduler preemption only ever make a window slower, never
 *     faster — so the fastest window is the cleanest estimate of the code's own
 *     cost. A fast chart renders 500 rows in ~3 ms, short enough that one GC
 *     pause dominates the window and drags a median into the slow cluster.
 */
function renderScenario(Component, props, count, reps = 7) {
  let bytes = 0;
  for (let w = 0; w < 2; w++) {
    for (let i = 0; i < count; i++) renderToStaticMarkup(h(Component, props(i)));
  }
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
  const ms = times[0];
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
// No global warm pass: renderScenario warms each component right before timing
// it, which is the only warmup that actually holds across 106 charts (see above).
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
