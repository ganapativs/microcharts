# @microcharts/mcp

## 0.1.2

### Patch Changes

- [#61](https://github.com/ganapativs/microcharts/pull/61)
  [`4dc842d`](https://github.com/ganapativs/microcharts/commit/4dc842d77ae81813cb1cd89f6cd543863dce4e14) Thanks
  [@ganapativs](https://github.com/ganapativs)! - Link the Glama registry listing from the server README.

  The README ships inside the package, so the badge — which renders the registry's security and quality score — only
  reaches npm on a release.

## 0.1.1

### Patch Changes

- [#59](https://github.com/ganapativs/microcharts/pull/59)
  [`129dd0f`](https://github.com/ganapativs/microcharts/commit/129dd0f19801a106d9bb90feabc51d8edaa5f7a3) Thanks
  [@ganapativs](https://github.com/ganapativs)! - Keep the MCP registry manifest in step with the published version.

  `server.json` carries the version the registry advertises, but `changeset version` only rewrites `package.json` — so a
  release would have shipped a manifest pointing at a version that wasn't on npm yet. The root `version` script now
  syncs it (`scripts/sync-server-json.mjs`), CI fails on drift, and the release job re-runs the sync and validates the
  manifest against the live registry schema before publishing.
