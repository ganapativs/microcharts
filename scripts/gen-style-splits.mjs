#!/usr/bin/env node
/**
 * Splits `styles.css` (plan/19 CSS-delivery escape hatch) and minifies every
 * shipped CSS artifact:
 *
 *   dist/styles.css             — the whole library, minified (this is what
 *                                 `@microcharts/react/styles.css` resolves to)
 *   dist/styles/core.css        — everything NOT inside an `@mc-chart` marker
 *   dist/styles/<slug>.css      — one file per single-chart-specific block
 *
 * `styles.css` (repo root) stays the unminified source of truth: its
 * `@mc-chart` markers drive this generator and the docs read it directly for
 * token/preset parity. Only the `dist/` copies ship, and all of them are
 * minified (comments + whitespace stripped via esbuild — no rule merging, so
 * `@layer` membership and cascade order are preserved). The per-chart split is
 * an opt-in escape hatch for consumers who import exactly one chart and want to
 * shave the chart-specific rules they don't use; `core.css` + `<slug>.css`
 * together are semantically equivalent to the matching subset of `styles.css`
 * (same rules, same `@layer` membership, same cascade order).
 *
 * Marking convention (hand-authored in styles.css, never generated):
 *   /* @mc-chart <slug> *\/  ...rules...  /* @mc-chart-end *\/
 * A marked block must sit at the top level of exactly one `@layer
 * microcharts.<name> { ... }` block (not nested inside a nested rule or
 * `@media`), so this script can track cascade layer membership with a
 * simple brace-depth counter instead of a full CSS parser.
 *
 *   node scripts/gen-style-splits.mjs          # write dist/styles/*.css
 *   node scripts/gen-style-splits.mjs --check  # exit 1 if dist is stale
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const root = resolve(import.meta.dirname, "..");
const srcPath = resolve(root, "styles.css");
const outDir = resolve(root, "dist/styles");

const MARKER_START = /^\s*\/\*\s*@mc-chart\s+([a-z0-9-]+)\s*\*\/\s*$/;
const MARKER_END = /^\s*\/\*\s*@mc-chart-end\s*\*\/\s*$/;
const LAYER_OPEN = /^\s*@layer\s+(microcharts\.[a-z]+)\s*\{\s*$/;

/**
 * Parses styles.css into an ordered list of top-level segments:
 *   - { type: "raw", lines }         — outside any `@layer { ... }` block
 *     (file header, the `@layer a, b, c, d;` order statement, blank lines
 *     between blocks) — always core, never chart-specific.
 *   - { type: "layer", name, tagged } — a `@layer microcharts.<name> { ... }`
 *     block, where each line is tagged with the chart slug it belongs to
 *     (or null for shared/core content).
 */
function parseStyles(text) {
  const lines = text.split("\n");
  const segments = [];
  let raw = [];
  let i = 0;

  const flushRaw = () => {
    if (raw.length > 0) segments.push({ type: "raw", lines: raw });
    raw = [];
  };

  while (i < lines.length) {
    const openMatch = lines[i].match(LAYER_OPEN);
    if (!openMatch) {
      raw.push(lines[i]);
      i++;
      continue;
    }
    flushRaw();
    const layerName = openMatch[1];
    const tagged = [];
    let depth = 1; // depth after the layer's own opening brace
    let currentSlug = null;
    i++;
    while (i < lines.length && depth > 0) {
      const line = lines[i];
      const startMatch = depth === 1 ? line.match(MARKER_START) : null;
      const endMatch = depth === 1 ? MARKER_END.test(line) : false;

      if (startMatch) {
        if (currentSlug) {
          throw new Error(`Nested @mc-chart marker at line ${i + 1} (already in "${currentSlug}")`);
        }
        currentSlug = startMatch[1];
        i++;
        continue; // marker comment itself is metadata, not emitted
      }
      if (endMatch) {
        if (!currentSlug) {
          throw new Error(`@mc-chart-end with no open marker at line ${i + 1}`);
        }
        currentSlug = null;
        i++;
        continue;
      }

      // naive brace counting — safe here because styles.css has no braces
      // inside string literals or comments.
      for (const ch of line) {
        if (ch === "{") depth++;
        else if (ch === "}") depth--;
      }

      if (depth === 0) {
        // this line is the layer's closing "}" — not part of any slug/core body
        i++;
        break;
      }

      tagged.push({ line, slug: currentSlug });
      i++;
    }
    if (currentSlug) {
      throw new Error(`@mc-chart ${currentSlug} marker never closed in @layer ${layerName}`);
    }
    segments.push({ type: "layer", name: layerName, tagged });
  }
  flushRaw();

  return segments;
}

function buildCore(segments) {
  const out = [];
  for (const seg of segments) {
    if (seg.type === "raw") {
      out.push(...seg.lines);
      continue;
    }
    const body = seg.tagged.filter((t) => t.slug === null).map((t) => t.line);
    out.push(`@layer ${seg.name} {`, ...body, `}`);
  }
  return `${out.join("\n").replace(/\n+$/, "")}\n`;
}

function collectSlugs(segments) {
  const slugs = new Set();
  for (const seg of segments) {
    if (seg.type !== "layer") continue;
    for (const t of seg.tagged) {
      if (t.slug) slugs.add(t.slug);
    }
  }
  return [...slugs].sort();
}

function buildChartFile(slug, segments) {
  const parts = [
    `/* @microcharts/react — augments core.css with ${slug}-specific rules (plan/19 escape hatch). */`,
    `/* Generated by scripts/gen-style-splits.mjs from styles.css — do not hand-edit. */`,
    ``,
  ];
  let any = false;
  for (const seg of segments) {
    if (seg.type !== "layer") continue;
    const body = seg.tagged.filter((t) => t.slug === slug).map((t) => t.line);
    if (body.length === 0) continue;
    any = true;
    parts.push(`@layer ${seg.name} {`, ...body, `}`, ``);
  }
  if (!any) throw new Error(`Marked slug "${slug}" produced no output`);
  return `${parts.join("\n").replace(/\n+$/, "")}\n`;
}

/** Pure: styles.css source text → { files: { "core.css"|"<slug>.css": text }, slugs }. */
export function generateFromSource(src) {
  const segments = parseStyles(src);
  const core = buildCore(segments);
  const slugs = collectSlugs(segments);
  const files = { "core.css": core };
  for (const slug of slugs) {
    files[`${slug}.css`] = buildChartFile(slug, segments);
  }
  return { files, slugs, segments };
}

/** Pure: marked slugs vs the set of known src/charts/<slug> dir names → unknown slugs. */
export function unknownSlugs(slugs, knownChartDirs) {
  const known = knownChartDirs instanceof Set ? knownChartDirs : new Set(knownChartDirs);
  return slugs.filter((slug) => !known.has(slug));
}

function listKnownChartDirs() {
  return readdirSync(resolve(root, "src/charts"), { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
}

async function main() {
  const src = readFileSync(srcPath, "utf8");
  const { files, slugs } = generateFromSource(src);

  const unknown = unknownSlugs(slugs, listKnownChartDirs());
  if (unknown.length > 0) {
    console.error(
      `styles.css marks unknown chart slug(s) (no matching src/charts dir): ${unknown.join(", ")}`,
    );
    process.exit(1);
  }

  // esbuild only strips comments + whitespace here (loader: "css", minify) — it
  // never merges or reorders rules, so `@layer` membership and cascade order
  // survive. Dynamically imported so the pure exports above stay dependency-free
  // for src/test/style-splits.test.ts.
  const { transformSync } = await import("esbuild");
  const minify = (css) => transformSync(css, { loader: "css", minify: true }).code;

  // Every shipped artifact is minified. The whole-library file lives at
  // dist/styles.css (what `@microcharts/react/styles.css` resolves to); the
  // split files live in dist/styles/.
  const outputs = new Map([[resolve(root, "dist/styles.css"), minify(src)]]);
  for (const [name, content] of Object.entries(files)) {
    outputs.set(resolve(outDir, name), minify(content));
  }

  if (process.argv.includes("--check")) {
    let stale = false;
    for (const [target, content] of outputs) {
      if (!existsSync(target) || readFileSync(target, "utf8") !== content) {
        console.error(`${target} is stale or missing.`);
        stale = true;
      }
    }
    if (existsSync(outDir)) {
      const expected = new Set(Object.keys(files));
      for (const name of readdirSync(outDir)) {
        if (!expected.has(name)) {
          console.error(`dist/styles/${name} exists but is no longer generated (stale file).`);
          stale = true;
        }
      }
    }
    if (stale) {
      console.error("Run `node scripts/gen-style-splits.mjs` to regenerate dist/ CSS.");
      process.exit(1);
    }
    console.log(`dist/ CSS matches styles.css (${outputs.size} files).`);
  } else {
    mkdirSync(outDir, { recursive: true });
    for (const [target, content] of outputs) {
      writeFileSync(target, content);
    }
    console.log(
      `dist/ CSS generated (minified): styles.css + core.css + ${slugs.length} chart file(s) (${slugs.join(", ")}).`,
    );
  }
}

// Only run the CLI when this file is executed directly (`node
// scripts/gen-style-splits.mjs`), not when imported by the test suite.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
