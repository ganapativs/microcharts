#!/usr/bin/env node
/**
 * Generates `.size-limit.json` from `package.json#exports` + the budget table
 * in `scripts/size-budgets.json` (plan/21 §6.0.B). The generated file is
 * committed; CI regenerates and fails on drift, so it can never be hand-edited.
 *
 *   node scripts/gen-size-limits.mjs          # write .size-limit.json
 *   node scripts/gen-size-limits.mjs --check  # exit 1 if committed file drifts
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const pkg = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"));
const budgets = JSON.parse(readFileSync(resolve(root, "scripts/size-budgets.json"), "utf8"));

/** exports value → its ESM entry file path (relative, no leading ./). */
function importPath(value) {
  const p = typeof value === "string" ? value : value.import;
  return p.replace(/^\.\//, "");
}

const entries = [
  // Whole barrel: tracked + published honestly, never gated (plan/21 §1) — no limit.
  {
    name: `${pkg.name} (root barrel, tracked not gated)`,
    path: importPath(pkg.exports["."]),
    gzip: true,
  },
];

const seen = new Set();
for (const [subpath, value] of Object.entries(pkg.exports)) {
  if (subpath === "." || subpath === "./package.json" || subpath === "./styles.css") continue;
  const slug = subpath.replace(/^\.\//, "").replace(/\/interactive$/, "");
  const kind = subpath.endsWith("/interactive") ? "interactive" : "static";
  const budget = budgets.charts[slug]?.[kind];
  if (!budget) {
    console.error(
      `size-budgets.json is missing "${slug}".${kind} for export "${subpath}" — every subpath needs an explicit budget (plan/21 §5).`,
    );
    process.exit(1);
  }
  seen.add(slug);
  entries.push({
    name: `${pkg.name}${subpath.slice(1)}${kind === "static" ? " (static)" : ""}`,
    path: importPath(value),
    limit: budget,
    gzip: true,
  });
}

for (const slug of Object.keys(budgets.charts)) {
  if (!seen.has(slug)) {
    console.error(`size-budgets.json has "${slug}" but package.json#exports has no "./${slug}".`);
    process.exit(1);
  }
}

entries.push({
  name: "styles.css (shared, whole library)",
  path: importPath(pkg.exports["./styles.css"]),
  limit: budgets.styles,
  gzip: true,
});

const out = `${JSON.stringify(entries, null, 2)}\n`;
const target = resolve(root, ".size-limit.json");

if (process.argv.includes("--check")) {
  const committed = readFileSync(target, "utf8");
  if (committed !== out) {
    console.error(
      ".size-limit.json is stale — run `node scripts/gen-size-limits.mjs` and commit the result (never hand-edit it).",
    );
    process.exit(1);
  }
  console.log(".size-limit.json matches its sources.");
} else {
  writeFileSync(target, out);
  console.log(`.size-limit.json generated (${entries.length} entries).`);
}
