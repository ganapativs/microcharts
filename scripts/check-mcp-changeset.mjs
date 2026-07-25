#!/usr/bin/env node
/**
 * Guard: a change to `packages/mcp` must come with a `@microcharts/mcp` changeset.
 *
 * Why this exists. `@microcharts/mcp` ships a *snapshot* of the library — the
 * chart catalog and `styles.css`, embedded at build time. When the library gains
 * a chart, `catalog-sync.test.ts` forces a re-`gen`, so the snapshot in the repo
 * is always current. But nothing forced it to be *published*: changesets does
 * not cascade a bump to a public dependent whose `workspace:^` range still
 * covers the new version (verified — only the private `apps/docs` /
 * `fixtures/next` bump), so npm would keep serving the old MCP with the old
 * catalog until someone remembered. This turns "someone remembered" into a gate.
 *
 * Retires itself for the PR that introduces the package: if `packages/mcp`
 * doesn't exist on the base ref, there is nothing to re-release.
 *
 *   node scripts/check-mcp-changeset.mjs [baseRef]   # default: origin/main
 */
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";

const base = process.argv[2] ?? "origin/main";
const PKG = "@microcharts/mcp";

function git(...args) {
  return execFileSync("git", args, { encoding: "utf8" }).trim();
}

function exists(ref, path) {
  try {
    execFileSync("git", ["cat-file", "-e", `${ref}:${path}`], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

if (!exists(base, "packages/mcp/package.json")) {
  console.log(`mcp-changeset: packages/mcp is new on this branch — nothing to re-release.`);
  process.exit(0);
}

// The release PR is the one branch that legitimately touches packages/mcp with
// NO changeset: `changeset version` consumes them, then bumps package.json,
// writes CHANGELOG.md, and (through the chained sync script) rewrites
// server.json. Without this, the guard would fail every release PR it exists to
// enable — verified by running both paths over an identical diff.
const headRef = process.env.GITHUB_HEAD_REF ?? "";
if (headRef.startsWith("changeset-release/")) {
  console.log(`mcp-changeset: ${headRef} is the release branch — changesets already consumed.`);
  process.exit(0);
}

const changed = git("diff", "--name-only", `${base}...HEAD`, "--", "packages/mcp")
  .split("\n")
  .filter(Boolean)
  // The version + changelog are what `changeset version` itself writes.
  .filter((f) => f !== "packages/mcp/package.json" && f !== "packages/mcp/CHANGELOG.md");

if (changed.length === 0) {
  console.log("mcp-changeset: no packages/mcp changes.");
  process.exit(0);
}

const declared = readdirSync(".changeset")
  .filter((f) => f.endsWith(".md") && f !== "README.md")
  .some((f) => readFileSync(`.changeset/${f}`, "utf8").includes(`"${PKG}"`));

if (declared) {
  console.log(`mcp-changeset: ${changed.length} file(s) changed, ${PKG} changeset present.`);
  process.exit(0);
}

console.error(
  `\npackages/mcp changed but no changeset releases ${PKG}:\n` +
    changed.map((f) => `  ${f}`).join("\n") +
    `\n\nThe published server embeds the chart catalog and styles.css, so an\n` +
    `unreleased change means npm keeps serving a stale snapshot. Run:\n\n` +
    `  pnpm changeset        # select ${PKG}\n`,
);
process.exit(1);
