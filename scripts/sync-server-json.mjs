#!/usr/bin/env node
/**
 * Keep `packages/mcp/server.json` — the MCP registry manifest — in step with
 * `packages/mcp/package.json`.
 *
 * The registry stores a version per entry, and it has to be the version that is
 * actually on npm. `changeset version` only rewrites `package.json`, so without
 * this the manifest silently lags a release: the Version PR would carry
 * `server.json@0.1.0` next to `package.json@0.1.1`, and the registry would then
 * advertise a version nobody can install. `mcp-docs.test.ts` asserts the two
 * agree, so unsynced is a red build rather than a bad publish — this script is
 * what makes that assertion satisfiable automatically.
 *
 *   node scripts/sync-server-json.mjs          # write
 *   node scripts/sync-server-json.mjs --check  # exit 1 if the committed file drifts
 *
 * Wired into the root `version` script (so the release PR is already correct)
 * and re-run in `release.yml` before publishing, as a belt-and-braces for a
 * hand-edited bump.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const pkgPath = resolve(root, "packages/mcp/package.json");
const manifestPath = resolve(root, "packages/mcp/server.json");

const check = process.argv.includes("--check");
const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
const before = readFileSync(manifestPath, "utf8");
const manifest = JSON.parse(before);

manifest.version = pkg.version;
for (const p of manifest.packages ?? []) {
  // Only registry types that carry a version field (npm/pypi/nuget); OCI and
  // MCPB encode it in the identifier.
  if (p.version !== undefined) p.version = pkg.version;
}
// The registry validates the manifest name against the npm package's `mcpName`.
if (manifest.name !== pkg.mcpName) {
  console.error(
    `sync-server-json: server.json name "${manifest.name}" !== package.json mcpName "${pkg.mcpName}"`,
  );
  process.exit(1);
}

const after = `${JSON.stringify(manifest, null, 2)}\n`;

if (check) {
  if (after !== before) {
    console.error(
      `sync-server-json: packages/mcp/server.json is stale (expected version ${pkg.version}).\n` +
        "  Run: node scripts/sync-server-json.mjs",
    );
    process.exit(1);
  }
  console.log(`sync-server-json: server.json matches package.json (${pkg.version}).`);
} else {
  writeFileSync(manifestPath, after);
  console.log(`sync-server-json: server.json → ${pkg.version}`);
}
