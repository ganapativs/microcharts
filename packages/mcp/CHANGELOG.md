# @microcharts/mcp

## 0.1.15

### Patch Changes

- [#123](https://github.com/ganapativs/microcharts/pull/123)
  [`f3a0b4a`](https://github.com/ganapativs/microcharts/commit/f3a0b4a3526004fd90c5e783928392609c3bba3a) Thanks
  [@ganapativs](https://github.com/ganapativs)! - Version-alignment bump for the scalar-kernel release of
  `@microcharts/react` — the embedded catalog and assets are regenerated at build time and carry no content change of
  their own.
- Updated dependencies
  [[`f3a0b4a`](https://github.com/ganapativs/microcharts/commit/f3a0b4a3526004fd90c5e783928392609c3bba3a),
  [`f3a0b4a`](https://github.com/ganapativs/microcharts/commit/f3a0b4a3526004fd90c5e783928392609c3bba3a)]:
  - @microcharts/react@0.18.0

## 0.1.14

### Patch Changes

- [#116](https://github.com/ganapativs/microcharts/pull/116)
  [`b80156e`](https://github.com/ganapativs/microcharts/commit/b80156e6278a384694fdeebd18e972923d775a3f) Thanks
  [@ganapativs](https://github.com/ganapativs)! - Re-publish the embedded catalog. Every chart entry gains
  `maxWidth`/`maxHeight` — the box the chart is authored for, which nothing previously stated — and a `gotchas` array
  carrying the facts that do not fit a prop description: the caps that lived only as dev warnings in the library source,
  which charts print their own sign, which take a raw sample rather than precomputed quantiles, and how `format` merges
  with a chart's own defaults. `get_microchart` returns both.
- Updated dependencies
  [[`b80156e`](https://github.com/ganapativs/microcharts/commit/b80156e6278a384694fdeebd18e972923d775a3f),
  [`b80156e`](https://github.com/ganapativs/microcharts/commit/b80156e6278a384694fdeebd18e972923d775a3f)]:
  - @microcharts/react@0.17.0

## 0.1.13

### Patch Changes

- [#113](https://github.com/ganapativs/microcharts/pull/113)
  [`e87cd0d`](https://github.com/ganapativs/microcharts/commit/e87cd0dd9933e61023bc49c8d11f78c004d97c66) Thanks
  [@ganapativs](https://github.com/ganapativs)! - Re-embed the catalog: `onSelect` now documents the third way a
  selection clears — a pointer press outside the chart — alongside re-selecting the unit and `Escape`, and the per-chart
  interaction note says the same.
- Updated dependencies
  [[`e87cd0d`](https://github.com/ganapativs/microcharts/commit/e87cd0dd9933e61023bc49c8d11f78c004d97c66)]:
  - @microcharts/react@0.16.0

## 0.1.12

### Patch Changes

- [#111](https://github.com/ganapativs/microcharts/pull/111)
  [`4985dd9`](https://github.com/ganapativs/microcharts/commit/4985dd94070e7facaa94812e11db3014109c2e2f) Thanks
  [@ganapativs](https://github.com/ganapativs)! - Rebuilds the embedded catalog against `@microcharts/react` with the
  readout and sizing fixes.

- Updated dependencies
  [[`4985dd9`](https://github.com/ganapativs/microcharts/commit/4985dd94070e7facaa94812e11db3014109c2e2f),
  [`4985dd9`](https://github.com/ganapativs/microcharts/commit/4985dd94070e7facaa94812e11db3014109c2e2f),
  [`4985dd9`](https://github.com/ganapativs/microcharts/commit/4985dd94070e7facaa94812e11db3014109c2e2f)]:
  - @microcharts/react@0.15.0

## 0.1.11

### Patch Changes

- [#109](https://github.com/ganapativs/microcharts/pull/109)
  [`bd8632c`](https://github.com/ganapativs/microcharts/commit/bd8632ca9c30a69305e01aa4674803de7c2b4af6) Thanks
  [@ganapativs](https://github.com/ganapativs)! - Regenerate the embedded catalog for `SparkBar`'s new `labels` prop.

- [#109](https://github.com/ganapativs/microcharts/pull/109)
  [`bd8632c`](https://github.com/ganapativs/microcharts/commit/bd8632ca9c30a69305e01aa4674803de7c2b4af6) Thanks
  [@ganapativs](https://github.com/ganapativs)! - Re-embeds the library stylesheet and chart catalog after the
  active-state theming channel landed, so the served assets carry the `--mc-active-*` and `--mc-rest-opacity` rules.
- Updated dependencies
  [[`bd8632c`](https://github.com/ganapativs/microcharts/commit/bd8632ca9c30a69305e01aa4674803de7c2b4af6),
  [`bd8632c`](https://github.com/ganapativs/microcharts/commit/bd8632ca9c30a69305e01aa4674803de7c2b4af6),
  [`bd8632c`](https://github.com/ganapativs/microcharts/commit/bd8632ca9c30a69305e01aa4674803de7c2b4af6),
  [`bd8632c`](https://github.com/ganapativs/microcharts/commit/bd8632ca9c30a69305e01aa4674803de7c2b4af6),
  [`bd8632c`](https://github.com/ganapativs/microcharts/commit/bd8632ca9c30a69305e01aa4674803de7c2b4af6)]:
  - @microcharts/react@0.14.0

## 0.1.10

### Patch Changes

- [#106](https://github.com/ganapativs/microcharts/pull/106)
  [`7d969b0`](https://github.com/ganapativs/microcharts/commit/7d969b0fac2dd2139312adf81c763a3bcbdba49a) Thanks
  [@ganapativs](https://github.com/ganapativs)! - **The catalog carries WindBarb's interactive entry.** `get_microchart`
  and `/catalog.json` now hand a model `@microcharts/react/wind-barb/interactive` alongside the static import, so the
  last static-only chart is no longer a special case.

  **The library stamp is set at build time.** It used to be committed into `catalog.generated.json`, written one commit
  before `changeset version` bumped the library — so every release published a snapshot naming the previous version and
  left the generated file stale on `main` until a follow-up sync PR corrected it. The server now reports the
  `@microcharts/react` version it was actually built against, and a chart change reaches npm from the PR that made it.

- Updated dependencies
  [[`7d969b0`](https://github.com/ganapativs/microcharts/commit/7d969b0fac2dd2139312adf81c763a3bcbdba49a)]:
  - @microcharts/react@0.13.0

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
