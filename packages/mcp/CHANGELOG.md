# @microcharts/mcp

## 0.1.4

### Patch Changes

- [#78](https://github.com/ganapativs/microcharts/pull/78)
  [`3766e86`](https://github.com/ganapativs/microcharts/commit/3766e8620e9d29547b568dbb81a5cf597ac1aa33) Thanks
  [@ganapativs](https://github.com/ganapativs)! - Re-embed the stylesheet so rendered SVGs carry the updated readout
  rules. No API or tool-surface change — the server inlines `styles.css`, so it needs a release whenever that file
  changes or npm keeps serving the previous snapshot.
- Updated dependencies
  [[`3766e86`](https://github.com/ganapativs/microcharts/commit/3766e8620e9d29547b568dbb81a5cf597ac1aa33)]:
  - @microcharts/react@0.9.0

## 0.1.3

### Patch Changes

- [#74](https://github.com/ganapativs/microcharts/pull/74)
  [`273e771`](https://github.com/ganapativs/microcharts/commit/273e7713f140f7f4969aa0a15e9de77a5952a042) Thanks
  [@ganapativs](https://github.com/ganapativs)! - Declare a real JSON Schema type for `render_microchart`'s `data`
  parameter. It was `z.any()`, which emits `{}` with no `type` — clients that build a form or a prompt from the schema
  (Glama's inspector among them) read that as an unknown field type, and a model learns nothing about what to pass. It
  is now the union the catalog actually uses: an array for ordered series, or an object for the few charts whose data is
  keyed. Scalar charts still omit it. Per-chart shapes are unchanged and still validated at render time.

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
