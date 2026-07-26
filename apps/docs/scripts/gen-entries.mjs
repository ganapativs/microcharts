/**
 * Emit a pure-data snapshot of every chart `entry` (no React components) to
 * `src/lib/charts/entries.generated.json`. The per-chart registry modules co-
 * locate metadata with heavy React previews / interactive entries, and Turbopack
 * won't tree-shake a `import { entry }` down to just the data — so any client
 * (or server) module that reads catalog metadata otherwise drags the whole
 * 106-chart component graph into the bundle. This snapshot breaks that edge:
 * `entries.ts` reads this JSON, so catalog consumers pull data only.
 *
 * A Vitest guard (`entries-generated.test.ts`) fails if the checked-in JSON
 * drifts from the live registry, so it can never go stale.
 *
 * WHY esbuild (this was a `tsx` script): the registry is TSX, and `tsx` was
 * never declared in any package.json — `pnpm gen:entries` simply failed, so the
 * snapshot had no working regeneration path. Node's native type-stripping can't
 * load it either (it does not handle JSX), and jiti chokes on the same. esbuild
 * is already a root dependency and `scripts/figma-export/lib/registry.mjs`
 * already loads this exact registry the same way, so this adds NO dependency.
 *
 * WHY the oxfmt pass at the end: oxfmt owns JSON formatting here, and raw
 * `JSON.stringify(…, 2)` expands every array one-element-per-line, which the
 * committed file does not. Without this, a regeneration produces a ~2000-line
 * diff that hides the handful of real changes. Formatting here keeps the
 * generator's output byte-identical to what is committed.
 *
 * WHY it formats over STDIN rather than the written path: `.oxfmtrc.json` has
 * a `.generated.json` glob in `ignorePatterns`, so pointing oxfmt at the output
 * file makes it exit 2 ("all matched files may have been excluded by ignore
 * rules") — the
 * file is written, the format pass is skipped, and `pnpm gen:entries` fails
 * while leaving the 2000-line expansion behind. Piping through
 * `--stdin-filepath` formats the same content under a non-ignored name, so the
 * ignore rule keeps doing its job (no formatter churn on generated files in
 * normal runs) and the generator still emits the committed formatting.
 */
import { build } from "esbuild";
import { execFileSync } from "node:child_process";
import { rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const docsDir = join(here, "..");
const out = join(docsDir, "src", "lib", "charts", "entries.generated.json");

// Bundle the TSX registry to ESM, keeping react external (we never render).
const res = await build({
  stdin: {
    contents: `export { CHARTS } from "./src/lib/charts/registry.ts";`,
    resolveDir: docsDir,
    loader: "ts",
  },
  bundle: true,
  format: "esm",
  platform: "node",
  jsx: "automatic",
  external: ["react", "react-dom", "react/jsx-runtime", "react-dom/server"],
  write: false,
  logLevel: "silent",
});

const tmp = join(docsDir, ".gen-entries-bundle.mjs");
writeFileSync(tmp, res.outputFiles[0].text);
try {
  const { CHARTS } = await import(`${new URL(`file://${tmp}`).href}?t=${res.outputFiles[0].hash}`);
  // Match the committed formatting (see note above).
  const formatted = execFileSync("pnpm", ["exec", "oxfmt", "--stdin-filepath=entries.json"], {
    cwd: docsDir,
    input: `${JSON.stringify(CHARTS, null, 2)}\n`,
    encoding: "utf8",
  });
  writeFileSync(out, formatted);
  console.log(`gen-entries: wrote ${CHARTS.length} chart entries to ${out}`);
} finally {
  rmSync(tmp, { force: true });
}
