# @microcharts/mcp

## 0.1.9

### Patch Changes

- [#99](https://github.com/ganapativs/microcharts/pull/99)
  [`fdef3ea`](https://github.com/ganapativs/microcharts/commit/fdef3ea2c88236684e65d0d2e6c85d1ffa8bb8f8) Thanks
  [@ganapativs](https://github.com/ganapativs)! - Point the embedded catalog's `library` field at
  `@microcharts/react@0.12.0` (the Version Packages bump left the generated snapshot on 0.11.0).

## 0.1.8

### Patch Changes

- [#96](https://github.com/ganapativs/microcharts/pull/96)
  [`48df549`](https://github.com/ganapativs/microcharts/commit/48df549d9138896c42e7e21a81cf47c4f670e3c4) Thanks
  [@ganapativs](https://github.com/ganapativs)! - Refresh the embedded `styles.css` snapshot so the published server
  matches the data-change glide CSS from `@microcharts/react`.
- Updated dependencies
  [[`c99fb68`](https://github.com/ganapativs/microcharts/commit/c99fb68023d5bc7a367b41742de17c0b2719dd75)]:
  - @microcharts/react@0.12.0

## 0.1.7

### Patch Changes

- [#91](https://github.com/ganapativs/microcharts/pull/91)
  [`261610d`](https://github.com/ganapativs/microcharts/commit/261610daa87f61e6038d68cded968c99894f0852) Thanks
  [@ganapativs](https://github.com/ganapativs)! - Refresh the embedded chart catalog after the 0.11.0 library release.

## 0.1.6

### Patch Changes

- [#88](https://github.com/ganapativs/microcharts/pull/88)
  [`461a258`](https://github.com/ganapativs/microcharts/commit/461a2585c1e36477514fe9c1679693905d6a6d8b) Thanks
  [@ganapativs](https://github.com/ganapativs)! - Refresh the embedded chart catalog and assets after the catalog
  correctness pass, and harden render-core for non-finite chart box props.
- Updated dependencies
  [[`461a258`](https://github.com/ganapativs/microcharts/commit/461a2585c1e36477514fe9c1679693905d6a6d8b),
  [`461a258`](https://github.com/ganapativs/microcharts/commit/461a2585c1e36477514fe9c1679693905d6a6d8b)]:
  - @microcharts/react@0.11.0

## 0.1.5

### Patch Changes

- [#81](https://github.com/ganapativs/microcharts/pull/81)
  [`e6ccfdb`](https://github.com/ganapativs/microcharts/commit/e6ccfdb4edaef65f329595c94d20090e76d6fa6c) Thanks
  [@ganapativs](https://github.com/ganapativs)! - Re-snapshot the embedded catalog and stylesheet after the consistency
  pass in `@microcharts/react`.

  The server ships both as committed snapshots, so an unreleased regeneration means npm keeps serving a stale one. What
  moved: `ActivityGrid.steps` and `RetentionCurve.compare` are new props an agent can now discover and set; `onActive`
  now appears on the scalar entries that only advertised `onSelect`; `summary`'s description now states the actual rule
  (`false` drops the generated sentence, and only a chart left with no `title` becomes decorative); and the embedded
  `styles.css` carries the label-contrast fixes, the achromatic `mono`/`eink` categorical ramp and the forced-colors
  mappings, so a chart rendered through `render()` reads the same as one rendered in an app.

- Updated dependencies
  [[`e6ccfdb`](https://github.com/ganapativs/microcharts/commit/e6ccfdb4edaef65f329595c94d20090e76d6fa6c),
  [`e6ccfdb`](https://github.com/ganapativs/microcharts/commit/e6ccfdb4edaef65f329595c94d20090e76d6fa6c),
  [`e6ccfdb`](https://github.com/ganapativs/microcharts/commit/e6ccfdb4edaef65f329595c94d20090e76d6fa6c),
  [`e6ccfdb`](https://github.com/ganapativs/microcharts/commit/e6ccfdb4edaef65f329595c94d20090e76d6fa6c),
  [`e6ccfdb`](https://github.com/ganapativs/microcharts/commit/e6ccfdb4edaef65f329595c94d20090e76d6fa6c),
  [`e6ccfdb`](https://github.com/ganapativs/microcharts/commit/e6ccfdb4edaef65f329595c94d20090e76d6fa6c)]:
  - @microcharts/react@0.10.0

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
