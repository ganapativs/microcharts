#!/usr/bin/env node
/**
 * Writes `scripts/size-snapshot.json` — the MEASURED gzip byte size of every
 * size-limit entry (root barrel, every chart subpath, styles.css), plus a
 * tracked-not-gated reading of the shared kernel chunks (see KERNELS below).
 *
 * This is the baseline `scripts/size-diff.mjs` compares a PR against. It is
 * committed and `--check`ed in CI for the same reason `.size-limit.json` is:
 * a stale snapshot would let a regression hide behind an old number, and a
 * hand-edited one would let it hide on purpose. Bytes, not kB — the PR gate
 * fires at 1%, which is ~10-20 B on the smallest charts.
 *
 * Requires a fresh `pnpm build`.
 *
 *   node scripts/size-snapshot.mjs          # write the snapshot
 *   node scripts/size-snapshot.mjs --check  # exit 1 if the committed file drifts
 */
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { gzipSync } from "node:zlib";

const root = resolve(import.meta.dirname, "..");
const pkg = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"));

// size-limit exits non-zero when any entry is over its budget — the snapshot
// still needs the measured sizes. Same pattern as scripts/sync-sizes.mjs.
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

/**
 * size-limit display name → the export subpath it measures. Keying on the
 * subpath (not the prose-laden display name) keeps old snapshots comparable
 * when a `name` in gen-size-limits.mjs is reworded.
 */
function keyFor(name) {
  if (name.startsWith("styles.css")) return "./styles.css";
  if (name === `${pkg.name} (root barrel, tracked not gated)`) return ".";
  const m = new RegExp(`^${pkg.name}/([a-z0-9-]+)(?:/(interactive)| \\(static\\))$`).exec(name);
  if (!m) return null;
  return m[2] ? `./${m[1]}/interactive` : `./${m[1]}`;
}

const entries = {};
for (const row of report) {
  const key = keyFor(row.name ?? "");
  if (!key) {
    console.error(`size-snapshot: unrecognised size-limit entry "${row.name}" — teach keyFor().`);
    process.exit(1);
  }
  entries[key] = row.size;
}

/**
 * The shared kernel: chunks tsdown emits once that nearly every entry of a kind
 * pulls in. Nothing in `dist/` *is* the kernel — the core is a handful of
 * hash-named chunks and no chart imports all of them — so there is no file to
 * point size-limit at, and these rows are TRACKED, NEVER GATED. Kernel growth
 * lands on ~200 subpaths at once, where the 1% per-subpath gate already catches
 * it; the point of measuring it here is that the PR report can say why 200
 * numbers moved together.
 *
 * Values are chunk basenames without the content hash, so a rebuild that only
 * rehashes a chunk leaves these numbers alone. Add a name when a module becomes
 * universal; a name that resolves to anything other than exactly one file is a
 * hard error, because a silently-skipped chunk would understate the kernel.
 */
// "stats" is gone from this list on purpose: once every static entry imported
// resolveSummary, stats.ts and summary.ts shared an importer set and rollup
// merged them into the one summary chunk. Its bytes are still counted — inside
// "summary" — so the kernel reading stays continuous.
const STATIC_KERNEL = ["types", "format", "Chart", "scale", "labels", "summary"];
const KERNELS = {
  "kernel:static": STATIC_KERNEL,
  // The picker/announce/seat layer every interactive entry adds on top. One
  // chunk since the LiveRegion unification: interactive.ts, live-region.tsx and
  // seat-hoist.ts share an importer set now, so rollup emits them as the single
  // "live-region" chunk.
  "kernel:interactive": [...STATIC_KERNEL, "live-region", "motion-gate"],
};

const distFiles = readdirSync(resolve(root, "dist"));

/** Chunk basename → its one hashed file in `dist/`. Exits on 0 or >1 matches. */
function resolveChunk(base) {
  const re = new RegExp(`^${base.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}-[A-Za-z0-9_-]{8}\\.js$`);
  const hits = distFiles.filter((f) => re.test(f));
  if (hits.length !== 1) {
    console.error(
      `size-snapshot: kernel chunk "${base}" matched ${hits.length} files in dist/ (${hits.join(", ") || "none"}) — the chunk was renamed, split, or inlined. Update KERNELS in this script.`,
    );
    process.exit(1);
  }
  return hits[0];
}

/**
 * Gzip of the declared chunks concatenated in declaration order. Raw-byte gzip
 * at a fixed level, like sync-sizes.mjs — deterministic across platforms, and
 * not comparable to a size-limit number, which bundles and minifies first.
 */
function measureKernel(bases) {
  const buf = Buffer.concat(bases.map((b) => readFileSync(resolve(root, "dist", resolveChunk(b)))));
  return gzipSync(buf, { level: 9 }).length;
}

const kernels = Object.fromEntries(
  Object.entries(KERNELS).map(([name, bases]) => [name, measureKernel(bases)]),
);

const snapshot = {
  $comment:
    "GENERATED by scripts/size-snapshot.mjs — measured gzip bytes per export subpath, the baseline for the PR size diff. Never hand-edit: run `pnpm build && pnpm size:snapshot`.",
  entries,
  kernels,
};
const out = `${JSON.stringify(snapshot, null, 2)}\n`;
const target = resolve(root, "scripts/size-snapshot.json");

if (process.argv.includes("--check")) {
  let committed;
  try {
    committed = readFileSync(target, "utf8");
  } catch {
    console.error(
      "scripts/size-snapshot.json is missing — run `pnpm build && pnpm size:snapshot`.",
    );
    process.exit(1);
  }
  if (committed !== out) {
    console.error(
      "scripts/size-snapshot.json is stale — run `pnpm build && pnpm size:snapshot` and commit the result.",
    );
    const prev = JSON.parse(committed);
    for (const [before, now] of [
      [prev.entries ?? {}, entries],
      [prev.kernels ?? {}, kernels],
    ]) {
      for (const key of new Set([...Object.keys(before), ...Object.keys(now)])) {
        if (before[key] !== now[key])
          console.error(`  ${key}: committed=${before[key] ?? "—"} measured=${now[key] ?? "—"}`);
      }
    }
    process.exit(1);
  }
  console.log(
    `size-snapshot.json matches the measured build (${Object.keys(entries).length} entries).`,
  );
} else {
  writeFileSync(target, out);
  console.log(`size-snapshot.json written (${Object.keys(entries).length} entries).`);
}
