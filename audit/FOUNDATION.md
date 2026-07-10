# Foundation v1 — core-system decisions (CHECKPOINT: needs human approval before 100× propagation)

Date 2026-07-10. Sources: audit/reports/{tokens,prop-contract,families,docs-pages}.md + audit/BASELINE.md. Library unreleased → renames are free now, forbidden later.

## 1. Token system (styles.css stays the single source)

1.1 **Delete dead tokens** `--mc-dot-size` and `--mc-radius` (zero consumers; preset overrides are no-ops today). Revisit only when a real consumer exists.
1.2 **Stroke-role tokens — fix the visual-weight fragmentation** (~90 charts hardcode 14 distinct secondary stroke widths, breaking presets + `prefers-contrast`):
   - Keep `--mc-stroke-width` = primary data ink (already bound via `[data-mc-ink="data"]`).
   - Add CSS bindings for two new ink roles: `[data-mc-ink="support"]` → `calc(var(--mc-stroke-width) * .75)` and `[data-mc-ink="hair"]` → `calc(var(--mc-stroke-width) * .5)`.
   - Charts drop literal `strokeWidth` on ticks/guides/halos/connectors and take a role attribute instead. Literals stay ONLY for truly geometric strokes (e.g. moon terminator) with a one-line justification.
   - Normalization map: 0.9/0.8/0.75/0.7 → support; 0.6/0.5/0.4 → hair; 1.2–1.8 secondary marks → data or justified literal. Singletons (spiral-year 0.4, star-spoke 1.8) normalized.
   - Result: presets (editorial 1.5 / vivid 2) and `prefers-contrast: more` scale the WHOLE chart, uniform family weight.
1.3 **Preset single source**: lib styles.css preset blocks gain the docs selector too (`[data-mc-theme="x"], [data-mc-preset="x"]`); docs global.css deletes its re-declared bundles (kills the vivid color/weight drift, mono/moon drift). Docs keeps only its documented base-binding contrast deltas.
1.4 Extract the 3× copy-pasted `rgba(255,255,255,0.96)` text-on-fill into one shared constant in core (not a token — no theming need identified).

## 2. Prop contract v1 (breaking renames, do now)

Adopt agent items 1–10 (audit/reports/prop-contract.md) with these calls:
- `highlight` = datum by index/label everywhere; histogram-strip/rug-strip value-based prop → `markValue`.
- `emphasis` reserved for structural units (lane/state/boundary: event-raster, hypnogram, partition-strip, trace-fold, ensemble-ghosts). `accent` (confusion-grid, tree-rings) folds into `highlight` if it addresses a datum, else `emphasis` — family agent decides per rule, documents choice.
- Denominators: **`total`** for discrete counts (icon-array `of`→total, tally-marks `max`→total; honeycomb/pictogram-row/tree-rings already `total`). **`max`** survives ONLY on progress (continuous goal). Documented as the one sanctioned pair.
- volume-profile `side`→`align`; depth-wedge `range`→`levels`; wind-barb `label`→enum; percentile-ladder/star-spoke `dots`→enum; shared `EmptyCellStyle` (`"outline" | "blank"`); calendar-strip gains `cell`/`gap`; honeycomb `cellR`→`cell` (per-family geometric interpretation documented); `readonly [number, number]` domains everywhere; shared `Orientation` type; cycle-plot/polar-clock/spiral-year use `Value[]` alias.
- Data-shape rule documented: single-series charts accept null-gap `Value[]` unless nulls are semantically impossible for the type (justify in the chart's geometry.ts header). heartbeat-blip `data` (timestamps) → rename prop to `events` (it is not a value series).
- CLAUDE.md vocab line amended: `animate` is not a prop; motion = client entries + CSS, controllable via reduced-motion + static server render (already true).

## 3. Count honesty

98 components = 98 pages = registry. Plan counts "100 types" (band sparkline, win-loss = variants). Decision: **standardize public counts on components (98)**; `CATALOG_TARGET` := 98 with a comment explaining the type/component distinction; sweep docs/marketing copy for "100". Option B for approval instead: add 2 new charts (mission encourages additions) to make 100 honest — candidates in §7.

## 4. Page guideline (canonical spec — applies to all 98)

Section order (existing de-facto template, gaps closed):
frontmatter → intro (chart-specific, quietly compelling) → hero `LiveDemo` → `## Install` Usage → `## Try it` Playground → `## Interactive` InteractiveDemo → `## When to use it` (Good/Avoid) → `## Sizing` (motion charts: `## Motion, and reduced motion`) → `## Variants` (every meaningful prop/variant shown ≥ once) → `## Edge cases` (NEW — empty/single/flat/null as LiveDemos where behavior matters) → `## Four homes` FourContexts (**required on all 98** — inline/cell/KPI/tab is the library's core value) → `## Why this default` → `## Accessibility` (quotes REAL describeSeries output) → `## Props` PropTable.
Rules: all snippets literal inline data (no `data={tokens}` placeholders — fix live-demo JSDoc contract by making snippets literal); pages with `format` prop get one locale example (de-DE or similar); verified claims only; sanctioned deviations stay (token-confidence text-is-chart, wind-barb "Reading the barb").
Immediate fixes: 4 truncated pages (benchmark-strip, coverage-strip, icon-array, percentile-ladder), 5 old pages missing "Why this default", 42 pages missing FourContexts, 16 placeholder-snippet pages.

## 5. Hard-gate remediation

- **Bench RED (12 charts, all frontier):** optimize geometry + emitted bytes (trace-fold ~6.6 kB/row is an output-size bug, not just CPU). Floors move only with written justification.
- **Visual specs:** add tests/visual/*.spec.ts for all 21 batch-4 charts (pattern-match existing specs).
- **Claim check:** stats.ts `ssr1000: 11.6ms` vs measured 37.2 ms — rerun bench ×3, fix the number or the regression.
- Axe re-verified per family in Phase 3.

## 6. Motion policy

All motion via installed Emil skills (emil-design-eng to decide, animation-vocabulary to specify, review-animations to gate; apple-design where fluid/gesture feel applies). Existing rules stand: CSS/WAAPI only, transform/opacity preferred, reduced-motion gated, server output static, no `d: path()`. Family agents run the four passes (Animate/Delight/Polish/Optimize) per chart; review-animations must pass before family sign-off.

## 7. New-chart candidates (proposals only — approval at checkpoint; would also restore count=100)

Shortlist to develop after families stabilize (creative-yet-usable, admission bar plan/05 §applies): 1) **micro-gantt / dependency-strip** (task spans + critical path in a cell) — distinct from event-timeline (no dependencies there); 2) **rolling-return triangle** (return-triangle heat wedge, investment/BI gap); 3) **queue-depth glyph** (arrivals vs service, live-ops gap). Pick ≤2. Not started until approved.

## 8. Phase 2 execution plan

- Branch `superaudit`; commit per phase/family.
- **First family = span (3 charts: event-timeline, partition-strip, trace-fold)** — small, exercises everything (worst bench offender, missing vspecs, token normalization, page gaps) → present as reference standard (2nd checkpoint).
- Then family-per-agent, end-to-end (chart + geometry + tests + vspec + bench + page + matrices), order: strip → profile → radial → glyph → grid → line → dot → bar → band → text → connector. Concurrency ≤3 families (shared files: styles.css/core edits land in foundation commit FIRST so family agents touch only their charts + pages).
- Each agent returns compact report: scores, before→after bytes/bench, diffs summary, flags. I review, spot-check visuals on docs preview, gate.
- Near-duplicate candidates (9 groups, audit/reports/families.md) stay flagged in the candidates report — no deletions.

## Approval asks
A. Token plan (§1) — incl. deleting 2 dead tokens + ink-role stroke system.
B. Prop renames (§2) — breaking, pre-release.
C. Count: standardize 98 (or approve Option B: +2 new charts → 100).
D. Page guideline (§4) — incl. FourContexts required on all 98 + new Edge-cases section.
E. First-family choice (span) + family order + ≤3 concurrency.
F. New-chart shortlist (§7) — which, if any, to green-light.
