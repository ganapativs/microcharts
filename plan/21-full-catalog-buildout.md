# 21 — Full-Catalog Buildout: all 100 types, one package, before launch

> **EXPANDED 2026-07-08 (same day): 96 → 100.** Four research-validated additions after a
> gap-analysis + literature pass (citations in plan/12 §catalog-expansion): **MicroScatter** (#35,
> core — correlation/relationship, the one classical omission; Harrison et al. InfoVis 2014),
> **LikertStrip** (#36, core — diverging stacked bar for ordinal sentiment; Heiberger & Robbins JSS 57(5)),
> **IconArray** (Q21, decision — rate as k-of-N frequency grid, reduces denominator neglect;
> Garcia-Retamero/Galesic/Gigerenzer MDM 2010), **ConfusionGrid** (F21, frontier — k×k agreement
> matrix, where errors go; Neo CHI 2022). Candidates evaluated and REJECTED the same day (overlap or
> read-back failure): beeswarm/strip-plot (rug-strip + micro-box + quantile-dots cover), compass
> (wind-barb covers), micro-Sankey (unreadable crossings at micro scale), micro-ECDF
> (percentile-ladder + histogram-strip cover). Counts below updated; batch totals: 1 → 29, 2 → 21,
> 3 → 22, 4 → 21.

> Status: **decision + execution master** · 2026-07-08 · Supersedes the launch-scope and packaging
> decisions in [10-roadmap.md](10-roadmap.md) Phases 5/5b′/5c′/5c and [15-expressive-charts.md](15-expressive-charts.md)
> packaging. Batch specs live in [22](22-batch-1-core-completion.md) · [23](23-batch-2-decision-micrographs.md) ·
> [24](24-batch-3-expressive.md) · [25](25-batch-4-frontier-and-release.md).
> Audit entries for every decision here: [12-research-audit.md](12-research-audit.md) §2026-07-08.

## 0. The decision (user, 2026-07-08)

1. **All 100 catalog types ship in `@microcharts/react` — one package.** No `@microcharts/expressive`.
   Multiple packages fragment adoption and confuse the story; the plan-15 packaging rationale was
   re-audited and found to be marketing/timing framing, not a technical constraint (grammar, tokens,
   a11y, budgets were always shared; subpath exports already give per-type tree-shaking). The
   *collection* (core / decision / expressive / frontier) becomes catalog **metadata**, not a package
   boundary. Exception: `@microcharts/outline` (font outlining) stays a separate future package — it
   carries a real dependency (opentype.js) and would break non-negotiable #1.
2. **The full catalog ships before launch.** Launch (roadmap Phase 4) moves after the buildout.
   Rationale: launch once with the only micro-chart library that is *complete*, not a 5-chart teaser.
3. **Quality is not negotiable at this scale.** Every chart lands per the component canon
   (CLAUDE.md), the per-chart DoD (plan/09 §5), and this doc's registration checklist. Batches gate
   on green CI + approved visuals before the next batch starts.
4. **Every already-shipped chart gets a hardening pass** (Batch 0): perf, size, best practices, and
   a value-add variant review (e.g. ActivityGrid round-dot cells).

## 1. Budget model v2 (amends plan/07 — the old "≤ 10 kB whole library" is retired)

The 10 kB whole-library gate was written for a 5-chart v1. At 100 types it is arithmetically
impossible and — more importantly — measures the wrong thing: **nobody imports the barrel; users pay
per subpath.** New gates:

| Metric | Budget | Gate |
|---|---|---|
| Gzip per static chart subpath (tree-shaken, incl. shared core) | **≤ 3 kB** hard · ≤ 2 kB target · simple charts (Delta-class) ≤ 1.5 kB. One documented flagship exception: Sparkline 3.35/4.35 kB (user-approved 2026-07-08, plan/12 — not a precedent) | size-limit per subpath |
| Gzip per interactive subpath | **≤ static + 1 kB** (≤ 4 kB hard) · **+ 0.35 kB motion-gate allowance** once the chart wires the opt-in `animate` entrance (2026-07-11 amendment; the entrance *engine* is NOT in this number — it ships as its own `./motion` subpath, import-once like styles.css, with its own budget row) | size-limit per subpath |
| Shared kernel (`core/` + `shared/`, fully tree-shaken cost of one minimal chart) | **≤ 5 kB** | size-limit on `./sparkline` (proxy) |
| `styles.css` (whole library, shared) | **≤ 12 kB** | size-limit |
| Whole barrel (`.`) | **tracked + published honestly, not gated** — README states "one chart ≈ 1–3 kB; all 100 ≈ N kB (still < ½ of one Recharts)" with the measured N | CI report comment |
| Runtime dependencies | **0** | unchanged |
| Client JS for static charts (RSC) | **0 bytes** | unchanged |
| SVG nodes | ≤ 6 typical · ≤ 12 documented max · N-cell charts (grids, rasters, strips) get a per-cell budget of 1 node + documented cap | unit test |
| SSR throughput | ≥ 50 rows/ms floor, per-chart bench scenario | bench harness |

`.size-limit.json` at 192+ entries is no longer hand-maintained: Batch 0 adds
`scripts/gen-size-limits.mjs` which generates it from `package.json#exports` + a per-chart limit
table checked in as `scripts/size-budgets.json`. Same for the docs site's `CHART_GZIP` stats record
(generated from size-limit output — never hand-keyed again).

All external claims change with this: plan/README headline, README pitch, docs stats, llms.txt.
"~1–2 kB per chart" survives (it's per-subpath and true); "≤ 10 kB library" dies everywhere.

## 2. Packaging & naming

- Flat subpaths, kebab-case slug, PascalCase component: `@microcharts/react/moon-phase` →
  `<MoonPhase>`. Every chart ships `./‹slug›` (static) + `./‹slug›/interactive` (client), per canon.
- Annotation layer gets its own shared entry `@microcharts/react/annotations`
  (`<Threshold>` `<Marker>` `<TargetZone>` `<Callout>`, `<Marker celebrate>`); tree-shaken, S1/S2-composable.
- Collections are metadata: `catalog.ts` entry field `collection: "core" | "decision" | "expressive" | "frontier"`,
  surfaced in docs nav/gallery filters and `/catalog.json` — never in import paths.
- **Variant-types** (catalog counts them in the 100 but they are modes of a parent component, per
  plan/05/15/17 relocations): Band sparkline = `Sparkline band`; Win-loss = `SparkBar mode="winloss"`
  (+ documented 3-state win/loss/tie); Lollipop = `DotPlot stem`; MountainRidges = `StackedArea
  style="ridge"`; ConfettiBurst = `<Marker celebrate>`; CooldownSweep = `ProgressRing sweep`;
  Micro-HOP = `EnsembleGhosts` interactive loop; fading-edge bands = `GradedBand`/`band` softEdge.
  Catalog entries for variant-types carry `variantOf: "‹slug›"` and link to the parent page section.

### Full slug table (100 = 5 shipped + 2 shipped-variants + 93 new)

| Batch | Components (slug) |
|---|---|
| shipped | sparkline · sparkbar · delta · bullet · activity-grid (+ band, win-loss variants) |
| 1 core (29) | horizon · ohlc · dual-sparkline · stacked-area · bump-strip · seismogram · histogram-strip · rug-strip · heat-strip · mini-bar · dot-plot · paired-bars · slope · micro-box · dumbbell · waterfall · progress · segmented-bar · progress-ring · micro-donut · funnel · pictogram-row · heat-cell · status-dot · trend-arrow · calendar-strip · event-timeline · **micro-scatter** · **likert-strip** (+ annotations entry) |
| 2 decision (21) | forecast-cone · quantile-dots · graded-band · ensemble-ghosts · benchmark-strip · ab-strips · shift-histogram · change-point · control-strip · error-budget · burn-chart · retention-curve · coverage-strip · net-flow · percentile-ladder · rate-volume · data-diff · quadrant-dot · cycle-plot · pareto-strip · **icon-array** |
| 3 expressive (22) | fat-digits · fill-word · tree-rings · moon-phase · constellation · sprout-row · garden-grid · thermometer · balance-beam · hourglass · tally-marks · dice-pips · music-staff · heartbeat-blip · breathing-dot · comet-trail · orbit-status · polar-clock · spiral-year · honeycomb · city-skyline · bubble-row |
| 4 frontier (21) | tape-gauge · station-glyph · wind-barb · dual-window-meter · depth-wedge · time-in-range · folded-day-band · hypnogram · waveform · minimap-strip · star-spoke · token-confidence · rubric-strip · eta-bar · volume-profile · phase-trace · trace-fold · event-raster · calibration-strip · partition-strip · **confusion-grid** |

## 3. Variant policy — "balanced, value-added, beautiful by default"

Every chart's spec enumerates **2–6 variants**, each justified in one line. Rules:

1. `data` alone renders the flagship look. No variant is required to get the beautiful default.
2. A variant earns its place only if it changes what the chart can *say* (new context, new data
   nuance, new medium) — never a style knob for its own sake (that's what tokens/presets are for).
3. Same-name-same-meaning: a variant prop introduced on one chart (`shape`, `mode`, `stem`, `sweep`,
   `style`) must mean the same thing wherever it reappears. New shared variant vocabulary this
   buildout introduces: `shape` (`"square" | "round" | "dot"` on cell-based charts), `mode`
   (data-semantic switch), `style` (documented render styling that never changes data meaning),
   `orientation` (`"horizontal" | "vertical"` where both genuinely read well).
4. New data shape = new component, never a variant (grammar rule, plan/04).
5. Every variant appears in the chart's Playground and has a visual baseline.

Canonical example (Batch 0 retrofit): `ActivityGrid shape="round" | "square" (default) | "dot"` —
round = friendlier product contexts, dot = radius-padding for dense strips; color scale and data
semantics identical across shapes.

## 4. Per-chart spec template (batch docs use exactly this)

```md
### ‹N›. ‹Component› — `‹slug›`
**Collection:** … · **Data shape:** S1|S2|S3|S4|structured (+ TS type) · **Source:** plan/‹XX› §…
**Question it answers:** one line.
**Primary encoding:** channel · **Precision:** high|medium|low (low ⇒ documented steer to the precise alternative)
**Default render:** viewBox, marks in z-order, node budget, label/gutter strategy (plan/18), tokens used.
**Props beyond shared grammar:** name · type · default · one-line justification (each).
**Variants (2–6):** name → what it newly lets the chart say.
**Geometry (`geometry.ts`):** exported pure fn signatures; inputs→outputs 2-dp rounded.
**New core needs:** none | module.fn (must exist in Batch 0 kernel or land in the same PR, property-tested).
**Interactive entry:** pointer math (nearest-x / grid / arc lookup), keyboard model, live-region text — or "skipped: ‹reason›".
**Summary (`‹slug›Summary`):** template + one REAL example sentence (this exact string appears in docs — docs-as-tests).
**Edge cases beyond the shared matrix:** chart-specific degenerates + documented behavior.
**Size budget:** static ≤ X kB / interactive ≤ Y kB (goes into scripts/size-budgets.json).
**Honesty notes:** lie-factor rules from the source doc (e.g. "never silently log-scale", "max-per-bucket, never mean").
**Docs page:** Playground knobs · 4-context angle (sentence/cell/KPI/tab) · "why this default" note.
```

## 5. Registration checklist (every chart, same PR — no exceptions)

Library: `src/charts/‹slug›/{geometry.ts, index.tsx, client.tsx, geometry.test.ts, index.test.tsx,
client.browser.test.tsx}` · `package.json#exports` pair · `tsdown.config.ts` entries pair ·
`scripts/size-budgets.json` entry (generator emits `.size-limit.json`) · new tokens/classes in
`styles.css` (if any) · changeset.

Quality: shared edge-case fixture suite green (Batch 0 extracts it to `src/test/edge-cases.ts` so
every chart imports the SAME matrix) · property tests on geometry · axe clean · summary exact-string
test · visual spec `tests/visual/‹slug›.spec.ts` (light/dark × presets) · bench scenario in the
Batch-0 generalized `bench/run.mjs` registry · containment test (coords + estimated text ≤ viewBox).

Docs (after the Batch-0 registry refactor, ONE file): `apps/docs/src/lib/charts/‹slug›.tsx`
(catalog entry + playground + interactive demo + recipes + demo data) + `content/docs/charts/‹slug›.mdx`
+ `meta.json` nav order. catalog.test.ts cross-validates against `package.json#exports`
automatically; `/catalog.json`, llms surfaces, gallery, showcase all derive from the registry.

## 6. Batch 0 — Foundation & hardening (no new chart types) — spec lives here

**0.A Docs registry refactor (do first — everything else depends on it).** Today 7 per-slug
switches exist (`gallery/page.tsx Preview`, `interactive.tsx Chart+HINTS`, `sizing.tsx recipesFor`,
`playground.tsx` record, `contexts.tsx`, `showcase.tsx cards`, `stats.ts CHART_GZIP`). At 96 charts
that's rot. Replace with one registry module per chart under `apps/docs/src/lib/charts/‹slug›.tsx`
exporting `{ entry: ChartEntry, Playground, InteractiveDemo, recipes, FourContexts? }`; a
`registry.ts` barrel composes `CHARTS`. Extend `ChartEntry` with `collection`, `variantOf?`,
`encoding: {channel, precision}`, `nodeBudget`. Migrate the existing 5; delete every switch.

**0.B Size/stats generation.** `scripts/gen-size-limits.mjs` (exports → `.size-limit.json` from
`scripts/size-budgets.json`) + `scripts/sync-sizes.mjs` (size-limit output → docs `CHART_GZIP`).
CI check: generated files match committed ones.

**0.C Shared kernel additions** (pure, React-free, property-tested; consumers listed):
- `core/quantile.ts` — `quantiles(values, ps)`, five-number summary, quantile-dotplot binning
  (Kay/Fernandes rounding) → micro-box, quantile-dots, ab-strips, benchmark-strip, percentile-ladder,
  folded-day-band, box-derived types.
- `core/bin.ts` — uniform binning (≤ 12 bins default), count normalization → histogram-strip,
  shift-histogram, volume-profile, calibration-strip.
- `core/arc.ts` — arc/sector/annulus path builders (integer-safe, 2-dp) → progress-ring, micro-donut,
  polar-clock, moon-phase, spiral-year, tree-rings, orbit-status.
- `core/stack.ts` — zero-anchored stacking + normalized shares + diverging (center-anchored) stack
  → stacked-area, segmented-bar, time-in-range, partition-strip, net-flow, likert-strip.
- `core/downsample.ts` — max-per-bucket (NEVER mean — spikes must survive; plan/17 F9) + min/max
  envelope → waveform, seismogram, minimap-strip, long-series sparkline guard.
- `core/calendar.ts` — week/month grid math (UTC, locale-start-of-week param) → calendar-strip,
  activity-grid (retrofit), spiral-year.
- `core/summary.ts` — S2/S3/structured templates land with their first consumer chart; ALL new
  strings go through `SummaryStrings` (no hardcoded English outside `EN`).
- Deterministic pseudo-random (`core/jitter.ts`, seeded, for ghost paths / constellation layout):
  seed derives from data, never `Math.random` (visual tests + SSR/hydration determinism).

**0.D Shipped-five hardening + variant pass** (each its own small PR):
- **ActivityGrid**: `shape="square"|"round"|"dot"`; calendar retrofit onto `core/calendar.ts`;
  cell-count perf audit (1 node/cell, no per-cell listeners — canon already ensures).
- **Sparkline**: long-series guard via `core/downsample.ts` (>~200 pts, documented); verify memo
  identity keys; `label="minmax"` parity check with plan/04.
- **SparkBar**: win/loss/tie 3-state mode (plan/17 absorbed refinement) documented.
- **Delta / Bullet**: best-practice re-review against canon (formatter caching already fixed
  2026-07-07); Bullet qualitative-band contrast re-check in dark presets. `bullet/geometry.ts`
  `.toSorted()` ES2022-floor violation found by three independent reviews 2026-07-08 and already
  fixed (→ `.sort()` on the freshly filtered array). Batch 0 guards the class at the compiler:
  `tsconfig.json` lib floor dropped to **ES2022**, so ES2023+ APIs are type errors in CI (implemented
  2026-07-08 — stronger than the originally planned grep; see plan/12 audit entry).
- Whole-lib perf audit: re-run bench, confirm ≥ 50 rows/ms SSR, re-measure all gzip numbers,
  regenerate stats. This is the "fastest on the internet" receipts baseline — claims only from
  `bench/` (working rule).
- `src/test/edge-cases.ts` extraction: one shared matrix (`[]`, `[x]`, all-equal, nulls, all-null,
  negative-only, huge/tiny, NaN/±Infinity, 10k points) applied by every chart's index.test.
- `bench/run.mjs` generalization: per-chart scenario registry (chart module + representative data),
  so batches add scenarios declaratively.

**0.E Plan/docs sync for the decision itself:** plan/07 amendment (§1 above), plan/10 roadmap
splice, plan/15 packaging note, plan/README headline, plan/12 audit entries, CLAUDE.md, STATUS.md.
Docs site: "96 planned" copy → "N of 100 shipped, all before launch"; llms.txt keeps the
does-not-support list (pie/gauge/donut-as-decoration stay out — MicroDonut ships with the
`decorative` framing per plan/05).

**Batch 0 DoD:** all existing tests green + new kernel modules property-tested + docs registry
refactor proven by zero behavior change (visual baselines unchanged) + size/stats generators wired
into CI + STATUS updated.

## 7. Batch sequencing & gates

| Batch | Doc | Contents | Gate to next |
|---|---|---|---|
| 0 | this §6 | foundation, kernel, hardening, docs registry | CI green, baselines unchanged, generators live |
| 1 | [22](22-batch-1-core-completion.md) | 29 core components (incl. micro-scatter, likert-strip) + annotations entry | full DoD ×29, Argos approved, bench green |
| 2 | [23](23-batch-2-decision-micrographs.md) | 21 decision micrographs (incl. icon-array) | full DoD ×21 + research-claim audit entries |
| 3 | [24](24-batch-3-expressive.md) | 22 expressive (motion types last within batch) | full DoD ×22 + reduced-motion equivalents verified |
| 4 | [25](25-batch-4-frontier-and-release.md) | 21 frontier (incl. confusion-grid) + release pitch (README/npm/GitHub/docs stats/OG/llms final) | full DoD ×21 + plan/20 §14 P0 checklist + Checkpoint 3 |

Within a batch: shared-infra items first, then charts ordered simple → complex; each chart is one
PR-sized unit satisfying §5 **and the §8a craft bar**. An implementing agent takes ONE batch doc +
this doc + CLAUDE.md canon as its complete brief. **No batch N+1 work before batch N's gate**
(roadmap checkpoint discipline). Every batch gate includes the §8a.7 design-skill sweep.

## 8a. The craft bar (added 2026-07-08, user mandate — part of every chart's gate)

Every chart must read as **carefully handcrafted, premium, human-designed** — never generated-looking.
This is a GATE, not a vibe: a chart whose DoD is green but whose render looks like default-library
output is NOT done. Concretely, per chart, before visual baselines are approved:

1. **Optical-correction pass** (plan/06 §6): half-pixel stroke alignment on hairlines, endpoint dots
   optically centered on line ends, padding derived from font metrics not arbitrary constants,
   integer-crisp rectilinear marks. Zoom to 400% in review — seams, overshoots, and off-center dots
   are defects.
2. **Legibility rules from live review practice** (memory `chart-legibility-and-review-practices`):
   text never merges with same-colour marks (dedupe coincident dots, gap the label); decorative
   edges stay subtler than content, especially in dark mode.
3. **Designed degenerate states.** Empty, single-point, all-equal, and all-null states must look
   *intentional* (a quiet designed placeholder), never broken or blank-by-accident. Each chart's
   docs page shows its empty state on purpose.
4. **Interaction feel** (memory `interactive-wrapper-fills-svg`): overlays/crosshairs track the
   cursor exactly (inner SVG fills the wrapper), focus rings align to marks, hover states never
   jitter or lag, keyboard order matches visual order.
5. **Anti-slop tells banned** (frontend-design skill DON'Ts + non-negotiable #6): no decorative
   gradients, no glow, no drop shadows on data ink, no arbitrary rounded-corner soup, no
   default-palette look, no uniform 8-px-grid sameness across charts that should each have a
   distinct, considered silhouette.
6. **Four-context eyeball** in light AND dark × `modern`/`editorial`/`mono` presets, plus
   forced-colors and reduced-motion, at 1× and dense data. Argos approval happens only after this
   pass — approving a baseline IS signing the craft review.
7. **Per-batch design-skill sweep**: before a batch's gate closes, run the design-review skill
   sequence over the batch's docs pages + gallery (round-10 precedent: design-taste/impeccable →
   polish → audit) and fix findings. Restraint applies — the brand is calm and matte; craft ≠ more
   effects.

## 8. Standing rules for implementing agents

- Read the chart's spec in its batch doc + its source plan doc section BEFORE coding. Code↔plan
  conflicts get surfaced, not silently resolved.
- Static entries: hook-free, listener-free, no `getBBox`/measure calls, no generated ids, labels via
  plan/18 numeric-anchor rules. Interactive entries: compose the static component — never re-draw.
- ES2022 floor · `makeFormatter` only · 2-dp rounding at generation · integer viewBox ·
  `crispEdges` only rectilinear · animation CSS/WAAPI only, no `d: path()`, reduced-motion gated.
- Summaries: real strings in docs (docs-as-tests). i18n through `SummaryStrings`.
- Never name-drop Tufte/theory in code comments, docs, or copy.
- Every chart PR updates STATUS.md's batch tracker line in the same commit.
