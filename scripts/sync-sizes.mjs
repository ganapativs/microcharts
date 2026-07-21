#!/usr/bin/env node
/**
 * Syncs measured per-subpath gzip sizes into the docs site:
 * runs `size-limit --json` over the built dist and writes
 * `apps/docs/src/lib/chart-sizes.json`, which `lib/stats.ts` re-exports as
 * `CHART_GZIP`. The docs numbers are therefore always measured, never
 * hand-keyed. Requires a fresh `pnpm build` first.
 *
 *   node scripts/sync-sizes.mjs          # write chart-sizes.json
 *   node scripts/sync-sizes.mjs --check  # exit 1 if committed file drifts
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const pkg = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"));

// size-limit exits non-zero when any entry is over budget — sync still needs
// the measured sizes. Same pattern as scripts/rebaseline-sizes.mjs.
let raw;
try {
  raw = execFileSync("pnpm", ["exec", "size-limit", "--json"], {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
} catch (e) {
  raw = e.stdout;
  if (!raw) throw e;
}
const report = JSON.parse(raw.slice(raw.indexOf("[")));

/** "@microcharts/react/sparkline (static)" → { slug, kind } (null for non-chart rows). */
function parseName(name) {
  if (!name.startsWith(`${pkg.name}/`)) return null;
  const sub = name.slice(pkg.name.length + 1);
  if (sub.startsWith("styles.css")) return null;
  const m = sub.match(/^([a-z0-9-]+)(\/interactive)?/);
  if (!m) return null;
  return { slug: m[1], kind: m[2] ? "interactive" : "static" };
}

const sizes = {};
for (const row of report) {
  const parsed = parseName(row.name);
  if (!parsed) continue;
  sizes[parsed.slug] ??= {};
  // size-limit reports gzip bytes (gzip: true); docs show decimal kB, 2 dp.
  sizes[parsed.slug][parsed.kind] = Math.round(row.size / 10) / 100;
}

const out = `${JSON.stringify(sizes, null, 2)}\n`;
const target = resolve(root, "apps/docs/src/lib/chart-sizes.json");

if (process.argv.includes("--check")) {
  const committed = readFileSync(target, "utf8");
  if (committed !== out) {
    console.error(
      "apps/docs/src/lib/chart-sizes.json is stale — run `pnpm build && node scripts/sync-sizes.mjs` and commit the result.",
    );
    // Show exactly which lines drifted so a cross-platform gzip difference is
    // debuggable from the CI log without re-running the build locally.
    const a = committed.split("\n");
    const b = out.split("\n");
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      if (a[i] !== b[i])
        console.error(
          `  L${i + 1}: committed=${JSON.stringify(a[i])} expected=${JSON.stringify(b[i])}`,
        );
    }
    process.exit(1);
  }
  console.log("chart-sizes.json matches the measured build.");
} else {
  writeFileSync(target, out);
  console.log(`chart-sizes.json written (${Object.keys(sizes).length} charts).`);
}
