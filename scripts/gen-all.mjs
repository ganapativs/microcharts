#!/usr/bin/env node
/**
 * Regenerates EVERY committed generated artifact in the monorepo, in dependency
 * order, and (with `--check`) proves none of them drifted.
 *
 *   pnpm gen:all            # regenerate everything
 *   pnpm gen:check          # regenerate, then fail if anything changed
 *   pnpm gen:all --skip-build   # reuse an existing dist/ (CI already built)
 *
 * Why one script: the generated files form a chain — the library build feeds the
 * measured sizes, the docs registry feeds the MCP catalog — and running them out
 * of order produces a snapshot that is internally consistent but wrong. Every
 * generator that owns a committed file belongs in STEPS; a generator missing
 * here is a file that can go stale on main.
 *
 * `--check` does not trust each generator's own `--check` flag (several have
 * none). It runs them all for real and then asks git whether any owned path
 * moved, so the guard is the same for every step and cannot silently pass.
 *
 * NOT here, deliberately — asset generators that are slow, need Python or a
 * headless browser, and change only when the brand does: `gen:brand-kit`,
 * `gen:wordmark`, `gen:promo`, `gen-favicon.py`, `figma:export`. Run those by
 * hand when the brand moves.
 */
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const check = process.argv.includes("--check");
const skipBuild = process.argv.includes("--skip-build");

/**
 * Ordered. `paths` are the committed files a step owns, relative to the repo
 * root — `--check` diffs exactly these, so an unrelated dirty file in the tree
 * never turns into a false failure.
 */
const STEPS = [
  {
    label: "library build (dist/ — everything measured below reads it)",
    cmd: ["pnpm", "build"],
    paths: [],
    skippable: true,
  },
  {
    label: ".size-limit.json (from package.json#exports + size-budgets.json)",
    cmd: ["node", "scripts/gen-size-limits.mjs"],
    paths: [".size-limit.json"],
  },
  {
    label: "scripts/size-snapshot.json (measured gzip bytes, PR size-diff baseline)",
    cmd: ["node", "scripts/size-snapshot.mjs"],
    paths: ["scripts/size-snapshot.json"],
  },
  {
    label: "apps/docs/src/lib/chart-sizes.json (docs size numbers)",
    cmd: ["node", "scripts/sync-sizes.mjs"],
    paths: ["apps/docs/src/lib/chart-sizes.json"],
  },
  {
    label: "apps/docs/src/lib/bench-summary.json (docs perf numbers, from bench/results.json)",
    cmd: ["node", "scripts/sync-bench.mjs"],
    paths: ["apps/docs/src/lib/bench-summary.json"],
  },
  {
    label: "packages/mcp/server.json (MCP registry manifest)",
    cmd: ["node", "scripts/sync-server-json.mjs"],
    paths: ["packages/mcp/server.json"],
  },
  {
    label: "docs chart registry snapshots",
    cmds: [
      ["pnpm", "--filter", "@microcharts/docs", "gen:entries"],
      ["pnpm", "--filter", "@microcharts/docs", "gen:docs-code"],
      ["pnpm", "--filter", "@microcharts/docs", "gen:preview-live"],
      ["pnpm", "--filter", "@microcharts/docs", "gen:playground-caps"],
      ["pnpm", "--filter", "@microcharts/docs", "gen:chart-modules"],
    ],
    paths: [
      "apps/docs/src/lib/charts/entries.generated.json",
      "apps/docs/src/lib/charts/docs-code.generated.ts",
      "apps/docs/src/lib/charts/preview-live.generated.ts",
      "apps/docs/src/lib/charts/playground-caps.generated.ts",
      "apps/docs/src/lib/charts/modules.generated.ts",
    ],
  },
  {
    // Reads the docs registry AND the built dist/styles.css — hence last.
    label: "packages/mcp embedded catalog + assets",
    cmd: ["pnpm", "--filter", "@microcharts/mcp", "gen"],
    paths: ["packages/mcp/src/catalog.generated.json", "packages/mcp/src/assets.generated.ts"],
  },
];

const run = (cmd) =>
  execFileSync(cmd[0], cmd.slice(1), { cwd: root, stdio: "inherit", encoding: "utf8" });

const owned = STEPS.flatMap((s) => s.paths);

for (const step of STEPS) {
  if (step.skippable && skipBuild) {
    console.log(`\n▸ ${step.label} — skipped (--skip-build)`);
    continue;
  }
  console.log(`\n▸ ${step.label}`);
  for (const cmd of step.cmds ?? [step.cmd]) run(cmd);
}

if (!check) {
  console.log(`\n✔ regenerated ${owned.length} committed artifacts — review and commit them.`);
  process.exit(0);
}

// `status --porcelain`, not `diff`: it also catches a generated file that is
// staged-but-stale or missing from the tree entirely.
const dirty = execFileSync("git", ["status", "--porcelain", "--", ...owned], {
  cwd: root,
  encoding: "utf8",
})
  .split("\n")
  .filter(Boolean)
  .map((l) => ({ state: l.slice(0, 2), file: l.slice(3) }));

if (dirty.length) {
  console.error(
    `\n✘ ${dirty.length} generated file(s) did not match their sources — they have just been regenerated for you:\n${dirty
      .map(({ state, file }) => `    ${file}${state.includes("?") ? "  (not committed yet)" : ""}`)
      .join("\n")}\n\n  Commit the regenerated files. Nothing generated may reach main by hand.`,
  );
  process.exit(1);
}

console.log(`\n✔ all ${owned.length} generated artifacts match their sources.`);
