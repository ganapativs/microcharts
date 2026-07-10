# Candidates report — near-duplicates, observations, proposals (superaudit 2026-07-10)

Nothing here was removed or merged; per mission rules these are FLAGS for human decision (Checkpoint 3 / launch review). Family agents + orchestrator concur on all entries. Cut-ledger policy (plan/15) respected throughout.

## Near-duplicate groups (flag only — with the family agents' read)

1. **sparkline / dual-sparkline** — dual is a sparkline + comparison series; arguably a prop variant. Kept: `compare` changes the data shape (two series), and "new data shape = new component" is law (plan/04 rule 3). RECOMMEND: keep, cross-link.
2. **progress / progress-ring / fill-word** — three geometries for "% complete". Already share logic (`progressModel`, `rollup`) rather than duplicating. fill-word trades precision for label-is-the-bar. RECOMMEND: keep all three, chooser page should route between them explicitly.
3. **heat-cell / heat-strip / activity-grid** — documented intentional siblings (building block → 1×N → 2-D). RECOMMEND: keep.
4. **quantile-dots / icon-array** — sample-derived probability (quantile binning + threshold probe) vs stated rate (fixed contiguous fill). Different data shapes and honesty concerns. RECOMMEND: keep.
5. **breathing-dot / heartbeat-blip** — continuous level vs discrete events; boundary documented on both pages. RECOMMEND: keep.
6. **control-strip / dual-window-meter / time-in-range** — all "noisy series vs a reference band"; band provenance differs (σ̂ estimate / dual rolling windows / clinical fixed range). STRONGEST merge candidate group by story overlap. RECOMMEND: keep all three but add when-to-use cross-links on the three pages + a chooser row (encodings genuinely differ; deletion would orphan real use cases).
7. **dumbbell / balance-beam** — position+connector vs tilt+area for two-value comparison. Balance-beam is the expressive read. RECOMMEND: keep.
8. **micro-donut / segmented-bar / partition-strip** — part-to-whole trio (ring / bar / two-level icicle). Share `rollup`. RECOMMEND: keep; chooser routes.
9. **dice-pips / tally-marks / pictogram-row** — pictogram-row is the general unit counter; the other two are culturally-fixed metaphors (die faces, tally strokes) that could be `renderPoint` presets but carry distinct reading conventions. RECOMMEND: keep.

## Deferred/observed items (not blocking, post-launch backlog)

- `data-mc-cat` stroke element-split (path/line/polyline) — one call site today (stacked-area top edge keeps a literal var()); add when a second consumer appears.
- event-raster's "full-weight vs data-role cascade asymmetry" — `data-mc-w="full"` now exists; event-raster's 1.4 tick literal stays justified.
- dual-window-meter `damping` prop declared but unused by the client entry — implement or remove pre-release (needs a product call).
- Shared readout/beam transitions use `--mc-duration` 300ms; Emil canon cites ≤200ms for UI feedback. The 300ms is the library-wide token (also used by value-morph transitions where slower reads better). OBSERVATION: consider `--mc-duration-fast: 200ms` for feedback-class transitions at a future polish pass — not churned now (token minimalism won).
- forced-colors mapping for the new line-split valence strokes (seismogram class) inherits author colors via `forced-color-adjust: none` — consistent with cells, but a dedicated forced-colors sweep at Checkpoint 3 should confirm by hand.
- comet-trail: docs can't demo `prefers-reduced-motion` interactively (browser setting) — acceptable.
- pictogram-row `renderPoint` escape hatch documented but not demoed on the page.

## New-chart proposals

User selected "standardize on 98" at checkpoint 1 — count stays 98; no new charts required for count honesty. The shortlist from FOUNDATION.md §7 (micro-gantt/dependency-strip, rolling-return triangle, queue-depth glyph) remains available as post-launch candidates; none started.
