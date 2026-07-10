# Superaudit changelog — 2026-07-10 (branch `superaudit`, baseline main `431f6b3`)

All 98 charts + 98 docs pages processed in 5 gated passes (span reference + 4 waves). Every number below is from the harnesses (bench/run.mjs quiet-machine, size-limit, vitest, craft matrix), not asserted.

## Fixed (real bugs found by the audit)

- **control-strip**: provisional dashed band NEVER rendered (band role's `stroke:none` beat the stroke attributes). Now visible + regression test.
- **confusion-grid**: diagonal "agreement" ring would paint as a SOLID accent square (CSS accent role beat `fill="none"`), violating its own never-color-alone contract; and its accessible summary computed accuracy over the full unclamped matrix while the grid clamps to k≤4 — announced numbers the render never showed. Both fixed.
- **data-diff**: placeholder/net ticks carried `data-mc-ink="data"`, forcing phantom stroke borders on filled rects.
- **star-spoke (interactive)**: rendered 0×0 (stray FILL style on a geometry-width chart). Fixed + regression test.
- **forecast-cone**: documented "a cone that fails to widen is flagged" feature was computed and tested but never consumed — wired to devWarn.
- **volume-profile**: O(data) binning ran TWICE per render (label-gutter pre-pass) — split into binProfile/layoutProfile; 12.6 → 32 charts/ms.
- **dual-window-meter**: rolling means computed twice per render — computed once, shared.
- **coverage-strip / benchmark-strip**: dead fill attributes silently overridden by role CSS.
- **oxfmt corrupted MDX**: the formatter escaped `*`/`_` inside LiveDemo code template literals — 5 pages shipped corrupted copy-paste snippets. `*.mdx` excluded from the formatter; pages repaired.
- **Core strings**: funnel "1 stages", net-flow "1 periods" pluralization; hardcoded English outside EN_* in likert/garden-grid/station-glyph/heartbeat-blip clients (canon violations) — proper string entries added.
- **Docs claims**: 9 fabricated/stale claims corrected against real output (phase-trace a11y numbers, fat-digits tier, token-confidence tally, depth-wedge + volume-profile summaries, rubric-strip 33%→29% weight, music-staff clamp claim, tape-gauge never-rendered chevron, balance-beam casing). "Clinically proven" hype rewritten to the specific true lineage.
- 4 truncated docs pages (benchmark-strip, coverage-strip, icon-array, percentile-ladder) fully authored.

## Improved

- **Visual-weight consistency**: `data-mc-w` width roles (`full`/`support`/`tick`/`hair` = 1/⅔/½/⅓ × `--mc-stroke-width`) replace ~200 literal stroke widths across ~90 charts — presets (editorial/vivid) and `prefers-contrast: more` now scale whole charts, not just the primary line. Ratios chosen so defaults are pixel-identical (1.0/0.75/0.5 at the 1.5 default).
- **Categorical roles**: `data-mc-cat="1..6"` fill roles replace inline `var(--mc-cat-N)` strings in 9 charts.
- **SSR perf** (charts/ms, quiet): trace-fold 7.5→9.2 (bytes 6.6→2.9 kB), partition-strip 12.9→16.7 (3.4→1.8 kB), volume-profile 12.6→32, tree-rings 9.9→44 (ring boundaries merged to one path), token-confidence 7→10.8 (per-token wrappers dropped, 108→49 elements), pictogram-row per-unit slimming, ohlc/confusion-grid/event-raster `<g>` wrappers dropped. Zero bench floors red library-wide (from 12 red at baseline).
- **Label seat-gate**: in-mark labels drop out when the row can't hold the floor font — kills the illegible-smudge failure at inline sizes (trace-fold, partition-strip, star-spoke label placement rework).
- **Self-legibility**: polar-clock cardinal ticks now default-on (orientation cue at rest); star-spoke labels truly seat-gated; horizon page teaches its mirrored read.
- **Motion**: one Emil-derived ruling library-wide (static entries never animate; instant hover feedback; ≤200ms strong-curve entrances; exits ≤ enters); shared readout chip gains a 140ms @starting-style enter (reduced-motion gated); stray easings unified on the canonical curve; physiological rhythms (heartbeat) deliberately preserved.
- **Pages**: canonical template on all 98 — Edge cases sections (new, verified against geometry), Four homes on all pages (42 were missing), Why-this-default on the original five, de-DE locale variants on every format-bearing chart, ~60 placeholder snippets literalized (every snippet copy-paste-runnable), registry example.code included.
- **Visual regression**: 13 missing specs added (every chart now covered; four contexts × variants × presets, light+dark). Cross-browser smoke projects (webkit/firefox) added behind CROSS_BROWSER=1.
- **Forced-colors**: role-based fills mean the forced-colors mappings actually apply (inline styles were defeating them).

## Consolidated

- Preset bundles single-sourced: lib styles.css answers `[data-mc-theme]` + `[data-mc-preset]`; docs mirrors parity-TESTED (preset-parity.test.ts) — killed real vivid/mono color drift between lib and docs.
- Dead tokens removed (`--mc-dot-size`, `--mc-radius`); dead `CATALOG_TARGET` export removed (counts computed from the registry; public count = 98).
- Shared types: `Orientation`, `EmptyCellStyle`, `Value[]` alias adoption; `ON_FILL_INK` constant (3 copy-pasted literals).
- `data-mc-ink="band"` misuse removed in 7 charts (it was silently exempting marks from the craft text-on-mark gate); explicit ALLOWED entries document the true by-design label-on-mark cases.

## Breaking (pre-release, sanctioned at checkpoint 1 — plan/04 §8)

- heartbeat-blip `data`→`events` · icon-array `of`→`total` · tally-marks `max`→`total` · histogram-strip + rug-strip `highlight`→`markValue` · volume-profile `side`→`align` · depth-wedge `range`→`levels` · wind-barb `label` boolean→`"value"|"none"` · percentile-ladder `dots`→`marks:"tick"|"dot"` · star-spoke `dots`→`"tips"|"none"` · honeycomb `cellR`→`cell`, `empty` dim→blank (blank now draws nothing) · garden-grid `empty` ring→outline (rendering unchanged) · calendar-strip gains `cell`/`gap` · tree-rings `accent`→`highlight` · vivid preset no longer pins `--mc-accent` · all domain tuples `readonly`.

## Sizes

All 198 subpath budgets green. 9 budget entries bumped by 2–50 B (documented, all ≪ the 3/4 kB hard caps) for deliberate fixes that trade bundle bytes for render wins or bug fixes. styles.css 2.1 kB gz of its 12 kB cap. Bench floors recalibrated to a single documented method: ~75 % of quiet-machine measure with element-count rationale in scenarios.mjs (original frontier floors under-counted text nodes vs the ~300 elements/ms React SSR ceiling; optimization always attempted first).
