#!/usr/bin/env node
/**
 * Syncs the SSR benchmark into the docs site — the perf-page twin of
 * `sync-sizes.mjs`. Reads `bench/results.json` (written by `pnpm bench`) and
 * writes a compact `apps/docs/src/lib/bench-summary.json`: the N-sparkline
 * scaling table, the core micro-bench, a per-chart throughput map, and the
 * aggregates the Performance page quotes (median, fastest/slowest, any chart
 * below its floor). `lib/docs-facts.ts` re-derives the prose numbers from it,
 * so the docs can never claim a throughput that the bench didn't measure.
 *
 *   node scripts/sync-bench.mjs          # write bench-summary.json
 *   node scripts/sync-bench.mjs --check  # exit 1 if committed file drifts
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const results = JSON.parse(readFileSync(resolve(root, "bench/results.json"), "utf8"));

const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];

const charts = {};
for (const c of results.charts) {
  charts[c.slug] = {
    rowsPerMs: c.rowsPerMs,
    msPer: c.msPer,
    avgBytes: c.avgBytes,
    floor: c.floor,
    pass: c.pass,
  };
}

const byThroughput = [...results.charts].sort((a, b) => b.rowsPerMs - a.rowsPerMs);
const fastest = byThroughput[0];
const slowest = byThroughput[byThroughput.length - 1];

const summary = {
  at: results.at,
  node: results.node,
  core: results.core,
  scenarios: results.scenarios,
  charts,
  agg: {
    count: results.charts.length,
    medianRowsPerMs: median(results.charts.map((c) => c.rowsPerMs)),
    medianMsPer: median(results.charts.map((c) => c.msPer)),
    medianBytes: median(results.charts.map((c) => c.avgBytes)),
    fastest: { slug: fastest.slug, rowsPerMs: fastest.rowsPerMs },
    slowest: { slug: slowest.slug, rowsPerMs: slowest.rowsPerMs },
    belowFloor: results.charts
      .filter((c) => !c.pass)
      .map((c) => ({ slug: c.slug, rowsPerMs: c.rowsPerMs, floor: c.floor })),
  },
};

const out = `${JSON.stringify(summary, null, 2)}\n`;
const target = resolve(root, "apps/docs/src/lib/bench-summary.json");

if (process.argv.includes("--check")) {
  const committed = readFileSync(target, "utf8");
  if (committed !== out) {
    console.error(
      "apps/docs/src/lib/bench-summary.json is stale — run `pnpm bench && node scripts/sync-bench.mjs` and commit the result.",
    );
    process.exit(1);
  }
  console.log("bench-summary.json matches the measured run.");
} else {
  writeFileSync(target, out);
  console.log(`bench-summary.json written (${summary.agg.count} charts).`);
}
