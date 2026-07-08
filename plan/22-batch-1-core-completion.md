# 22 — Batch 1: Core Completion (29 components + annotations entry)

> **EXPANDED 2026-07-08 (96 → 100, plan/21 header):** +#29 MicroScatter and +#30 LikertStrip (specs at the end of this doc; research provenance in plan/12 §catalog-expansion). Counts below updated 27 → 29.

> Batch 1 spec · 2026-07-08 · template/checklist in [21-full-catalog-buildout.md](21-full-catalog-buildout.md)
> (§4 template, §5 registration checklist, §8 standing rules — all apply verbatim, not restated here).
> Source catalog: [05-chart-catalog.md](05-chart-catalog.md) §3. Grammar: [04-api-design.md](04-api-design.md).
> Labeling: [18-text-labeling.md](18-text-labeling.md). Anatomy/interaction: [03-architecture.md](03-architecture.md) §3/§6.

## Batch overview

- **Contents:** the 29 remaining core catalog types + the shared `@microcharts/react/annotations` entry (30 specs). Completes plan/05 §3 (36 core types; 5 shipped + 2 shipped variants precede this batch). MicroScatter rides wave W3, LikertStrip wave W4.
- **Prerequisite:** Batch 0 complete (plan/21 §6) — kernel modules `core/quantile|bin|arc|stack|downsample|calendar|jitter`, shared edge-case matrix `src/test/edge-cases.ts`, docs registry, size-budget generator. No Batch-1 PR lands before the Batch-0 gate.
- **Ordering below is implementation order** (simple → complex). Suggested PR waves: **W1** scalar glyphs (#1–4) · **W2** tick/cell strips (#5–9) · **W3** categorical rows (#10–13) · **W4** part-to-whole (#14–19, annotations #28 lands first in this wave so S1/S2 hosts can adopt it) · **W5** composed series (#20–25) · **W6** time-structured (#26–27). One chart = one PR satisfying plan/21 §5.
- **Every chart:** static + interactive entries per the component canon (CLAUDE.md), containment test, real summary string in docs (docs-as-tests), i18n via `SummaryStrings` — new template keys named per spec land with their first consumer and are reused verbatim by later consumers.
- **Batch DoD (gate to Batch 2, plan/21 §7):** full per-chart DoD ×29 + annotations entry, Argos baselines approved (light/dark × presets), bench scenarios registered and ≥ 50 rows/ms, size budgets green from `scripts/size-budgets.json`, STATUS.md batch tracker updated per PR.
- Size budgets below are the numbers to enter in `scripts/size-budgets.json` (static / interactive, gzip; hard caps from plan/21 §1 always apply on top).

## Shared conventions used by every spec (write once)

- **Ink attributes:** marks tag themselves `data-mc-ink="data" | "bar" | "fill" | "band" | "point" | "accent" | "label"` and take color from tokens (`--mc-stroke`, `--mc-accent`, `--mc-positive`, `--mc-negative`, `--mc-neutral`, `--mc-band`, `--mc-cat-N`). `color` prop overrides via inline style, per grammar precedence.
- **Label gutters** (plan/18): reserved *before* geometry from `maxFormattedLength × 0.62em` estimate; text placed by `text-anchor` at known x; fontSize set as an SVG attribute in viewBox units via the shared `labelMetrics` helper; label y clamped by font ascent. Categorical text is anchor-only; deterministic drop-out thresholds are stated per chart.
- **Interactive entries** compose the static component (`summary={false}`, overlay marks as children), one pointer listener on the wrapper, pure nearest-lookup math, wrapper `<span tabIndex={0} role="img" aria-label>` + polite live region, announcements via `SummaryStrings`. Only deviations from this pattern are stated per spec.
- **Formatting:** `makeFormatter` only. Date/time formatting (calendar-strip, event-timeline) goes through a new cached `makeDateFormatter` in `core/format.ts` (same caching discipline; lands with calendar-strip).

---

### 1. TrendArrow — `trend-arrow`

**Collection:** core · **Data shape:** S4 (`value: number` — signed change, ratio or absolute per `format`) · **Source:** plan/05 §3 S4 #31
**Question it answers:** "Which way is this moving?" — at glyph size, before any number.
**Primary encoding:** glyph orientation (up / down / flat) · **Precision:** low — docs steer to `Delta` when the magnitude matters.
**Default render:** `viewBox="0 0 16 16"`. Marks (z-order): 1 glyph `<path>` (`data-mc-ink="data"`, filled). With `showValue`, +1 `<text>` in a right gutter (viewBox widens by `maxFormattedLength` ch estimate). Node budget ≤ 2. Tokens: `--mc-positive`/`--mc-negative` via `positive` polarity; flat = `--mc-neutral`. Direction is never color-alone: the glyph shape *is* the direction.
**Props beyond shared grammar:**
- `value: number` · required · the signed change; sign → direction, magnitude only used by `showValue`/summary.
- `flatBand?: number` · `0` · |value| ≤ flatBand renders the flat glyph — declares a noise floor so tiny wiggles don't read as movement.
- `glyph?: "arrow" | "triangle" | "chevron"` · `"arrow"` · arrow = default legibility; triangle = solid mark for dense table columns; chevron = lightest inline-text weight.
- `showValue?: boolean` · `false` · appends the formatted value — sentence/KPI contexts where the glyph alone is too terse.
**Variants (2–6):** `glyph` (3 weights for 3 densities) · `flatBand` (honest "no real change" states) · `showValue` (glyph → glyph+number) · `positive="down"` (latency/churn semantics, shared grammar rule 6).
**Geometry (`geometry.ts`):**
```ts
export function trendArrowGeometry(opts: {
  width: number; height: number;
  direction: "up" | "down" | "flat";
  glyph: "arrow" | "triangle" | "chevron";
}): { d: string; labelX: number; labelY: number }
```
Paths are precomputed unit shapes scaled to the box, 2-dp.
**New core needs:** none.
**Interactive entry:** no pointer math (nothing to point at). `live` mode: announces direction changes through the polite live region using the summary string; endpoint pulse (CSS, reduced-motion-gated) on change. Keyboard: focusable wrapper only.
**Summary (`trendArrowSummary`):** `strings.scalarDir(direction, amount)` (new S4 key, lands here) → direction word + formatted value. Real example: **"Up 12%."** (`value={0.12}`, percent format). Flat: `strings.flatChange` → "No change."
**Edge cases beyond the shared matrix:** `value` NaN/±Infinity → flat glyph, neutral ink, summary "No data." · `value === 0` → flat · `flatBand < 0` → treated as 0.
**Size budget:** static ≤ 1.2 kB / interactive ≤ 2.0 kB.
**Honesty notes:** glyph never scales with magnitude (an arrow twice as long is a lie at this precision); `flatBand` must be a real noise threshold, not cosmetic smoothing — document.
**Docs page:** Playground knobs: value, glyph, flatBand, showValue, positive. 4-context angle: table-cell direction column is the hero. "Why this default": arrow over triangle — reads at 8 px and in forced-colors.

---

### 2. StatusDot — `status-dot`

**Collection:** core · **Data shape:** S4 (`status: StatusKind`) · **Source:** plan/05 §3 S4 #30
**Question it answers:** "What state is this thing in right now?"
**Primary encoding:** paired glyph shape + semantic color — **never color-alone by construction** · **Precision:** n/a (categorical).
**Default render:** `viewBox="0 0 8 8"`. 1 `<path>`/`<circle>` per state (node budget ≤ 2 incl. pulse halo). State → (glyph, token) mapping is fixed and documented:
`ok` filled circle/`--mc-positive` · `warn` triangle/`--mc-cat-1` (amber) · `error` diamond/`--mc-negative` · `off` hollow ring/`--mc-neutral` · `busy` half-filled circle/`--mc-accent`. Distinct silhouettes survive grayscale, print, and `forced-colors`.
**Props beyond shared grammar:**
- `status: "ok" | "warn" | "error" | "off" | "busy"` · required · the five built-in semantic states.
- `pulse?: boolean` · `false` · CSS-keyframe halo (reduced-motion-gated, in `styles.css`) — "this state is live," monitoring contexts.
- `states?: Record<string, { glyph: "circle" | "triangle" | "diamond" | "ring" | "half"; token: string; label: string }>` · built-ins · extend/override the state map for domain vocabularies while preserving the shape+color pairing invariant; `label` feeds the summary.
**Variants (2–6):** `pulse` (live-now attention) · `states` (domain state vocabularies without breaking the a11y pairing) · `title` composition (naming the *thing*, not the state — shared grammar).
**Geometry (`geometry.ts`):**
```ts
export function statusDotGeometry(opts: {
  width: number; height: number; glyph: StatusGlyph;
}): { d: string } | { cx: number; cy: number; r: number; hollow: boolean }
```
**New core needs:** none.
**Interactive entry:** `live` announce on `status` change ("Deploys: degraded."); focusable wrapper. No pointer math. Skip rationale for hover: a single 8-px state mark has nothing to reveal on hover that the summary doesn't already say.
**Summary (`statusSummary`):** `strings.status(stateLabel)` (new key) → Real example: **"Status: degraded."** (custom state) / built-in `warn` → "Status: warning."
**Edge cases beyond the shared matrix:** unknown `status` string with no `states` entry → renders `off` glyph + dev warning · `pulse` + reduced-motion → static halo-less dot.
**Size budget:** static ≤ 1.2 kB / interactive ≤ 2.0 kB.
**Honesty notes:** the glyph mapping is a contract — never let a theme or `color` override collapse two states into the same silhouette; `color` prop recolors but never reshapes.
**Docs page:** Playground: status, pulse, custom-state editor. 4-context: table cell (service list) hero; sentence ("API is ● operational"). "Why this default": shape+color pairing beats a colored disc for the 1-in-12 colorblind users — stated plainly, no theory citations.

---

### 3. HeatCell — `heat-cell`

**Collection:** core · **Data shape:** S4 (`value: number` + `domain`) · **Source:** plan/05 §3 S4 #29
**Question it answers:** "How intense is this one value relative to a known scale?" — the calibrated-color building block for host-owned grids.
**Primary encoding:** discrete color step · **Precision:** low — docs steer to MiniBar/DotPlot when values must be compared precisely.
**Default render:** `viewBox="0 0 12 12"`. 1 `<rect>` (`shape-rendering: crispEdges`, `data-mc-ink="bar"`), fill = accent at stepped opacity (same step scale as ActivityGrid). Optional centered `<text>` when `label="value"`. Node budget ≤ 2.
**Props beyond shared grammar:**
- `value: number` · required.
- `steps?: number` · `5` · discrete perceptual steps (shared with ActivityGrid/HeatStrip) — continuous opacity is a false-precision channel at 12 px.
- `shape?: "square" | "round" | "dot"` · `"square"` · shared cell vocabulary (plan/21 §3); round = product surfaces, dot = radius-padded dense strips.
- `domain` (shared grammar) defaults to `[0, 1]` here — a lone cell has no data to auto-scale from; document loudly.
**Variants (2–6):** `shape` (3) · `label="value"` (cell doubles as a number chip in wider table cells) · `steps` (calibration granularity).
**Geometry (`geometry.ts`):**
```ts
export function heatCellGeometry(opts: {
  width: number; height: number; value: number;
  domain: readonly [number, number]; steps: number;
  shape: "square" | "round" | "dot";
}): { x: number; y: number; w: number; h: number; rx: number; step: number; t: number }
```
`step` = 0-based bin, `t` = clamped normalized value, both 2-dp.
**New core needs:** none — uses the step-scale helper shared with ActivityGrid (promoted to `core/scale.ts` during Batch 0 hardening; if still chart-local, promote in this PR).
**Interactive entry:** focus + announce formatted value and step ("42 — level 3 of 5."); no pointer lookup needed (one target). Parity with ActivityGrid's per-cell announcement wording.
**Summary (`heatCellSummary`):** `strings.level(value, step, steps)` (new key) → Real example: **"42 — level 3 of 5."**
**Edge cases beyond the shared matrix:** value outside `domain` → clamped to end step, summary appends nothing (clamping documented) · `domain` of zero width → single mid step, dev warning.
**Size budget:** static ≤ 1.3 kB / interactive ≤ 2.1 kB.
**Honesty notes:** discrete steps only, and every cell in one host grid must share one `domain` — per-cell auto-scaling is the lie `SparkGroup` exists to kill; docs show the shared-domain recipe.
**Docs page:** Playground: value, domain, steps, shape, label. 4-context: table-cell matrix hero. "Why this default": 5 steps is the most a reader reliably distinguishes at cell size.

---

### 4. Progress — `progress`

**Collection:** core · **Data shape:** S3 (`value` against `max`) · **Source:** plan/05 §3 S3 #21
**Question it answers:** "How far along is this, exactly?"
**Primary encoding:** bar length (zero-anchored) + direct % label · **Precision:** high.
**Default render:** `viewBox="0 0 48 8"` with a right label gutter reserved from `maxFormattedLength("100%")` ch estimate. Marks: track `<rect>` (`--mc-band`) → fill `<rect>` (accent, crispEdges) → `<text text-anchor="end">` percent (tabular-nums). Node budget ≤ 4 (continuous) / ≤ 3 + segments (segmented).
**Props beyond shared grammar:**
- `value: number` · required.
- `max?: number` · `1` · denominator; `value/max` is the rendered fraction.
- `segments?: number` · `undefined` · discrete-chunk track (e.g. 3-of-5 onboarding steps) — changes what the chart *says* from ratio to step count.
- `label` (shared prop, chart enumeration): `"percent"` (default) `| "value" | "fraction" | "none"` — fraction = "3/5" in segmented contexts.
**Variants (2–6):** `label` modes (ratio vs count vs bare bar) · `segments` (continuous → stepped semantics) · `positive="down"` (burn-down: less is good — affects summary wording only, bar stays factual).
**Geometry (`geometry.ts`):**
```ts
export function progressGeometry(opts: {
  width: number; height: number; fraction: number;
  segments?: number; gutterCh: number; fontSize: number;
}): {
  track: Rect; fill: Rect; segments: Rect[] | null;
  labelX: number; labelY: number;
}
```
`fraction` pre-clamped to [0, 1] by the component; overflow handled there.
**New core needs:** none.
**Interactive entry:** `live` announce on value change, throttled to whole-percent changes (no spam); keyboard = focusable wrapper. No pointer lookup (single mark). Fill-width transition (CSS, reduced-motion-gated).
**Summary (`progressSummary`):** `strings.progress(pct)` (new S3 key) → Real example: **"68% complete."** Segmented: `strings.stepsDone(done, total)` → "3 of 5 steps."
**Edge cases beyond the shared matrix:** `value > max` → fill clamps at 100%, label shows the true percent ("112%") — never silently caps the *number* · `max <= 0` → empty track + "No data." · fractional `value` with `segments` → floor to whole segments, remainder as partial segment fill.
**Size budget:** static ≤ 1.5 kB / interactive ≤ 2.3 kB.
**Honesty notes:** bar always zero-anchored; the label never disagrees with the bar except in the documented >100% clamp, where the label carries the truth.
**Docs page:** Playground: value, max, segments, label. 4-context: KPI card + table cell heroes. "Why this default": the percent label is the datum — a bare bar is decoration.

---

### 5. RugStrip — `rug-strip`

**Collection:** core · **Data shape:** S1 (`data: number[]` — raw observations; x-position = value) · **Source:** plan/05 §3 Trend #12
**Question it answers:** "Where do the raw observations actually sit?" — distribution without binning; composes under a Sparkline or beside a MicroBox.
**Primary encoding:** tick position on the value axis; density via ink accumulation (low fixed opacity per tick) · **Precision:** high per-observation, medium for density.
**Default render:** `viewBox="0 0 60 10"`. Marks: N tick `<line>`s rendered as one `<path>` with `M…V…` segments (`data-mc-ink="data"`, `stroke-opacity: 0.35`) → optional highlight tick (full opacity, accent, slightly taller). Node budget ≤ 2 (one path + highlight) — never one node per tick.
**Props beyond shared grammar:**
- `highlight?: number` · `undefined` · one value emphasized against the field ("your salary vs the band") — the chart's strongest single story.
- `orientation?: "horizontal" | "vertical"` · `"horizontal"` · vertical rug sits beside distributions in margin compositions.
**Variants (2–6):** `highlight` (field → field-plus-you) · `orientation` · `domain` override for cross-row comparability (shared grammar, called out because rugs mislead worst under per-row autoscale).
**Geometry (`geometry.ts`):**
```ts
export function rugGeometry(opts: {
  width: number; height: number;
  values: readonly number[]; domain?: readonly [number, number];
  highlight?: number;
}): { d: string; ticks: number[]; highlightX: number | null }
```
`ticks` = x positions (2-dp) retained for the interactive nearest lookup.
**New core needs:** `quantile.quantiles` (median for the summary).
**Interactive entry:** pointer → nearest tick by x (binary search over sorted `ticks`); announces `strings.observation(value, rank, count)` → "5.2 — 19th of 38."; ←/→ step through sorted observations.
**Summary (`rugSummary`):** `strings.observations(count, min, max, median)` (new key) → Real example: **"38 values from 3.1 to 9.7, median 5.2."**
**Edge cases beyond the shared matrix:** > 400 ticks → dev warning + documented steer to `histogram-strip` (a rug's promise is *raw* marks; we never downsample it) · duplicate values → coincident ticks darken via opacity accumulation (that's the density read, documented).
**Size budget:** static ≤ 1.8 kB / interactive ≤ 2.6 kB.
**Honesty notes:** every tick is one real observation — no jitter, no smoothing, no thinning. Opacity accumulation is the only density channel.
**Docs page:** Playground: data size, highlight, domain. 4-context: sentence ("you are here" in a pay band) hero. "Why this default": 35% tick opacity keeps singles visible while letting stacks read as density.

---

### 6. MiniBar — `mini-bar`

**Collection:** core · **Data shape:** S2 (`data: {label: string; value: number}[]`) · **Source:** plan/05 §3 S2 #14
**Question it answers:** "Which category is biggest, and by roughly how much?"
**Primary encoding:** bar length, zero-anchored · **Precision:** high.
**Default render:** `viewBox="0 0 50 16"`. Vertical columns, uniform gap (1 viewBox unit), `crispEdges`, `data-mc-ink="bar"`, single ink `--mc-stroke`; `highlight` bar = `--mc-accent`. No category text at default size (anchor-only rule: labels live in the summary + interactive readout). Node budget: 1/bar, ≤ 8 bars documented cap (beyond → dev warning, steer to a full bar chart, this is a *cell* chart).
**Props beyond shared grammar:**
- `sort?: "none" | "desc" | "asc"` · `"none"` · ranking read vs positional read — reordering changes what the chart says, so it's data-facing, not styling.
- `highlight?: number | string` · `undefined` · index or label; emphasize "this row's own category" in table contexts.
- `orientation?: "horizontal" | "vertical"` · `"vertical"` · horizontal rows for wider, shorter cells.
**Variants (2–6):** `sort` (ranking) · `highlight` (comparative anchor) · `orientation` · signed data (bars extend below the zero baseline; with `positive` set, pos/neg tokens engage — otherwise stays single-ink).
**Geometry (`geometry.ts`):**
```ts
export function miniBarGeometry(opts: {
  width: number; height: number;
  values: readonly (number | null)[]; domain?: readonly [number, number];
  gap?: number; orientation: "horizontal" | "vertical";
}): { bars: { x: number; y: number; w: number; h: number; sign: 1 | -1 | 0 }[]; baseline: number }
```
**New core needs:** none (S2 summary templates land here — first S2 consumer).
**Interactive entry:** pointer → bar index by x-band lookup; announces `strings.category(label, value, rank, count)` → "East: 940 — 1st of 4."; ←/→ roving across bars; focus ring overlay on the active bar.
**Summary (`miniBarSummary`):** `strings.categories(count, maxLabel, maxValue, minLabel, minValue)` (new S2 key) → Real example: **"4 categories. Highest East 940, lowest North 120."**
**Edge cases beyond the shared matrix:** null value → gap slot (bar omitted, slot width preserved — alignment survives) · duplicate labels → allowed, rank wording uses position · single category → one bar + `strings.single` reuse.
**Size budget:** static ≤ 2.0 kB / interactive ≤ 2.8 kB.
**Honesty notes:** bars always zero-anchored (non-negotiable); `sort` never silently defaults to `desc` — the data's own order is the default truth.
**Docs page:** Playground: data, sort, highlight, orientation. 4-context: table cell hero (per-row category mix). "Why this default": unsorted default preserves positional meaning (weekday order, funnel order) that sorting would destroy.

---

### 7. PictogramRow — `pictogram-row`

**Collection:** core · **Data shape:** S3 (`value` of `total` discrete units) · **Source:** plan/05 §3 S3 #26
**Question it answers:** "How many of the N units are filled?" — counts a human can verify by counting (seats, ratings, slots).
**Primary encoding:** filled-unit count (●●●○○) · **Precision:** high (it *is* the number).
**Default render:** `viewBox="0 0 60 12"`. N unit glyphs on one row, equal spacing; filled units `--mc-accent`, empty units hollow ring in `--mc-neutral` (fill state = shape difference too — filled vs hollow, never opacity-alone). Fractional last unit = filled glyph clipped by a `<clipPath>` rect at the fraction. Node budget: 1/unit + 1 clip, `total ≤ 20` documented cap (beyond → steer to `progress`).
**Props beyond shared grammar:**
- `value: number` · required · filled units (may be fractional).
- `total: number` · required · unit count.
- `shape?: "dot" | "square"` · `"dot"` · shared cell vocabulary; square packs tighter in table cells.
- `fractional?: "clip" | "round"` · `"clip"` · clip shows the true partial unit; round is for contexts where partial units are meaningless (seats) — data nuance, so a prop, not a theme.
**Variants (2–6):** `shape` · `fractional` · `renderPoint` escape hatch (custom unit glyph — star ratings) — documented as the *only* sanctioned pictogram customization.
**Geometry (`geometry.ts`):**
```ts
export function pictogramGeometry(opts: {
  width: number; height: number; value: number; total: number;
  shape: "dot" | "square";
}): { units: { cx: number; cy: number; r: number; fill: number }[] } // fill: 0 | 1 | fraction
```
**New core needs:** none.
**Interactive entry:** `live` announce on value change ("6 of 8."); focusable wrapper. No per-unit pointer targets (the units are one datum — hovering unit 4 of 8 has no distinct meaning).
**Summary (`pictogramSummary`):** `strings.countOf(value, total)` (new key) → Real example: **"5 of 8."** (Context noun comes from `title`: "Committee seats held".)
**Edge cases beyond the shared matrix:** `value > total` → all filled + dev warning, summary states the true numbers ("9 of 8.") · `total <= 0` → "No data." · `value < 0` → all empty + true summary.
**Size budget:** static ≤ 1.6 kB / interactive ≤ 2.4 kB.
**Honesty notes:** unit size is constant — never scale glyph size with value (the classic pictogram lie); one row only, no wrapped grids (that's ActivityGrid territory).
**Docs page:** Playground: value, total, shape, fractional. 4-context: sentence hero ("holds ●●●○○ of the seats"). "Why this default": clip over round — the partial unit is real data.

---

### 8. Seismogram — `seismogram`

**Collection:** core · **Data shape:** S1 (`data: (number | null)[]` — per-slot event intensity; 0/null = quiet) · **Source:** plan/05 §3 Trend #10
**Question it answers:** "When did things happen, and how hard?" — event density and intensity over ordered time.
**Primary encoding:** tick presence (density) + tick length (intensity) · **Precision:** medium — steer to Sparkline for level tracking, EventTimeline for labeled events.
**Default render:** `viewBox="0 0 60 16"`. Ticks read as a seismograph trace: **unsigned intensity mirrors each tick symmetrically about a centered baseline** (magnitude = full length, half each way — the instrument's signature; no midline drawn, the centered ticks imply their own axis); **signed data keeps a zero baseline** with direction encoding sign (up = +, down = −) and draws the midline hairline. Amended 2026-07-08 (§8-rev, audit R-SEISMO-CENTER): the earlier "bottom edge for all-positive" default read as a bar strip and diverged from `chart-gallery.html`'s seismo() reference — centered is now the default for all data. Node budget ≤ 2 typical (one tick path; +1 flag path when `anomaly` set, +1 midline when signed).
**Props beyond shared grammar:**
- `mode?: "intensity" | "barcode"` · `"intensity"` · barcode collapses heights to uniform full-length ticks — pure occurrence density when magnitudes are noise (shared `mode` vocabulary: data-semantic switch).
- `anomaly?: number` · magnitude threshold; ticks with `|v| ≥ anomaly` flare in the alert token (`--mc-negative`). Honest — author sets the threshold, and the flag is redundant with tick length (never color-alone). "Spikes flag anomalies" (the gallery card promise) is delivered by this prop.
**Variants (2–6):** `mode` (intensity ↔ presence) · signed data (zero baseline + midline — direction of shocks) · `positive` polarity coloring of signed ticks · `anomaly` spike flagging.
**Geometry (`geometry.ts`):**
```ts
export function seismogramGeometry(opts: {
  width: number; height: number;
  values: readonly (number | null)[]; domain?: readonly [number, number];
  mode: "intensity" | "barcode"; anomaly?: number;
}): {
  dData: string; dPos: string; dNeg: string; dFlag: string;
  ticks: { x: number; y0: number; y1: number; v: number; flag: boolean; slot: number }[];
  baselineY: number; signed: boolean; downsampled: boolean; slotW: number;
}
```
**New core needs:** `downsample.maxPerBucket` — series longer than `width` px-slots collapse via max-per-bucket (spikes must survive; never mean).
**Interactive entry:** pointer → nearest-x tick; announces `strings.point` reuse ("Slot 88 of 120: 8.") plus quiet slots ("Slot 40: no event."); ←/→ step slots, Home/End first/last event.
**Summary (`seismogramSummary`):** `strings.events(count, peak)` (new key) → Real example: **"34 events, peak 8."** (count = non-zero/non-null slots).
**Edge cases beyond the shared matrix:** all-zero (no events) → empty strip + "No events." (`strings.noEvents`) · single spike among zeros must render at full height (regression test — this is the chart's whole job) · downsampled render → summary still computed from raw values, never the buckets.
**Size budget:** static ≤ 2.0 kB / interactive ≤ 2.8 kB.
**Honesty notes:** max-per-bucket downsampling only, documented; barcode mode must be labeled as presence-only in docs (a tall-looking uniform tick is not intensity).
**Docs page:** Playground: data, mode, signed toggle, anomaly threshold. 4-context: table cell (error bursts per service) hero. "Why this default": a centered seismograph trace over bottom-anchored bars — the symmetric flare reads as event intensity, not a magnitude comparison, and stays visually distinct from SparkBar.

---

### 9. HeatStrip — `heat-strip`

**Collection:** core · **Data shape:** S1 (`data: (number | null)[]`) · **Source:** plan/05 §3 Trend #13
**Question it answers:** "How did intensity evolve, glanceably?" — value-by-time as calibrated color cells; the 1×N sibling of ActivityGrid.
**Primary encoding:** discrete color step per time cell · **Precision:** low — steer to Sparkline when shape matters.
**Default render:** `viewBox="0 0 60 10"`. N cell `<rect>`s filling the width (gap 1), `crispEdges`, accent at stepped opacity — identical step scale and `shape` vocabulary as ActivityGrid/HeatCell. Null = empty cell (hairline outline, `--mc-band`). Node budget: 1/cell, documented cap 60 cells; longer series collapse via max-per-bucket.
**Props beyond shared grammar:**
- `steps?: number` · `5` · shared step-scale granularity.
- `shape?: "square" | "round" | "dot"` · `"square"` · shared cell vocabulary.
**Variants (2–6):** `shape` (3) · `steps` · `domain` override (cross-row calibration — same warning as HeatCell).
**Geometry (`geometry.ts`):**
```ts
export function heatStripGeometry(opts: {
  width: number; height: number;
  values: readonly (number | null)[]; domain?: readonly [number, number];
  steps: number; gap?: number; shape: CellShape;
}): { cells: { x: number; y: number; w: number; h: number; rx: number; step: number | null }[] }
```
**New core needs:** `downsample.maxPerBucket` (> 60 cells). Step scale shared with ActivityGrid (see HeatCell note).
**Interactive entry:** pointer → cell by x-band lookup; announces `strings.point` reuse ("Cell 12 of 30: 18."); ←/→ roving cell focus with focus-ring overlay (1-D restriction of ActivityGrid's 2-D nav — same wording, same overlay style).
**Summary (`heatStripSummary`):** reuses `describeSeries` verbatim (S1). Real example: **"Trending up 12%. Range 3 to 18. Last value 17."**
**Edge cases beyond the shared matrix:** nulls interleaved → empty cells hold their slot (time alignment survives) · all values in one step (low variance) → uniform strip; summary carries the differences.
**Size budget:** static ≤ 1.8 kB / interactive ≤ 2.6 kB.
**Honesty notes:** discrete steps, shared `domain` across sibling rows, max-per-bucket only — the three ways a heat strip lies, all closed.
**Docs page:** Playground: data, steps, shape, domain. 4-context: table cell (per-tenant load) hero. "Why this default": square cells + 1-unit gap keep cell boundaries legible at 10 px height where round shapes blur.

---

### 10. DotPlot — `dot-plot`

**Collection:** core · **Data shape:** S2 (`data: {label: string; value: number}[]`) · **Source:** plan/05 §3 S2 #15
**Question it answers:** "How do a few named values compare on one scale?" — minimum ink per comparison.
**Primary encoding:** dot position on a common scale · **Precision:** high.
**Default render:** `viewBox="0 0 60 H"` where `H = max(16, rows × 8)`. One row per category: dot (`r=2`, `data-mc-ink="point"`) at value x; left label gutter reserved from `min(maxLabelChars, 6)` ch estimate, category text `text-anchor="end"` (anchor-only; truncated by *character count* to 6 + "…", never measured). Node budget: ≤ 2/row + text, rows ≤ 7 documented.
**Props beyond shared grammar:**
- `stem?: boolean` · `false` · hairline from zero to each dot (absorbs the former Lollipop, plan/21 §2 `variantOf`) — anchors position reading to zero when magnitude-from-zero is the story.
- `highlight?: number | string` · `undefined` · accent one category.
- `orientation?: "horizontal" | "vertical"` · `"horizontal"` (rows) · vertical = columns for narrow tall slots.
**Variants (2–6):** `stem` (position → magnitude-from-zero) · `highlight` · `label="value"` (value text right of each dot, anchor-only, drops out below 8-unit row height — deterministic from props) · `orientation`.
**Geometry (`geometry.ts`):**
```ts
export function dotPlotGeometry(opts: {
  width: number; height: number;
  values: readonly (number | null)[]; domain?: readonly [number, number];
  gutterCh: number; fontSize: number; stem: boolean;
}): { rows: { y: number; x: number; stemX0: number }[]; labelX: number; zeroX: number }
```
**New core needs:** none.
**Interactive entry:** pointer → row by y-band lookup; announces `strings.category` reuse ("Ada: 88 — 2nd of 5."); ↑/↓ roving rows (rows are the axis here).
**Summary (`dotPlotSummary`):** `strings.categories` reuse. Real example: **"5 categories. Highest Ada 96, lowest Kim 41."**
**Edge cases beyond the shared matrix:** with `stem` and negative values → stems extend from zero both ways; domain must include 0 (auto-widened, documented) · two categories with equal values → coincident dots get a 0.5-unit vertical de-overlap *within the row band* (deterministic, documented — legibility, not data change).
**Size budget:** static ≤ 2.2 kB / interactive ≤ 3.0 kB.
**Honesty notes:** without `stem`, domain may be data-fit (position read); with `stem`, zero-anchored domain is forced (magnitude read) — the prop flips the honesty regime and docs say so.
**Docs page:** Playground: data, stem, highlight, label, orientation. 4-context: KPI card (team leaderboard) hero. "Why this default": dots over bars when the scale doesn't start at zero — position lies less than truncated length.

---

### 11. Dumbbell — `dumbbell`

**Collection:** core · **Data shape:** S2-paired — `data: { label?: string; from: number; to: number }[]` (new record shape earns a new component, grammar rule 3) · **Source:** plan/05 §3 S2 #19
**Question it answers:** "Where did each row start and end (or how wide is its range)?"
**Primary encoding:** two dot positions + connecting span on a common scale · **Precision:** high.
**Default render:** `viewBox="0 0 60 12"` for one row; `H = rows × 12` multi-row. Per row: connector `<line>` (`--mc-neutral`) → hollow `from` dot → filled `to` dot (`data-mc-ink="point"`); hollow-vs-filled makes direction shape-coded, never color-alone. With `positive` set, connector takes pos/neg token by direction. Left label gutter as DotPlot. Node budget ≤ 3/row, rows ≤ 5 documented.
**Props beyond shared grammar:**
- `highlight?: number | string` · `undefined` · accent one row.
**Variants (2–6):** single-row cell form vs multi-row comparison · `positive` direction coloring · `label="value"` (from/to values anchored outside the dots: from-label `text-anchor="end"` left of from-dot, to-label `start` right of to-dot; drops out when the span is under `2 × label estimate` — deterministic) · `highlight`.
**Geometry (`geometry.ts`):**
```ts
export function dumbbellGeometry(opts: {
  width: number; height: number;
  pairs: readonly { from: number; to: number }[];
  domain?: readonly [number, number]; gutterCh: number; fontSize: number;
}): { rows: { y: number; x0: number; x1: number; dir: 1 | -1 | 0 }[]; labelX: number }
```
**New core needs:** none.
**Interactive entry:** pointer → row by y-band; announces `strings.fromTo` (below) per row; ↑/↓ roving rows, ←/→ within a row toggles from/to announcement ("From: 62,000." / "To: 84,000.").
**Summary (`dumbbellSummary`):** `strings.fromTo(from, to, direction, pct)` (new key) → Real example: **"From 62,000 to 84,000, up 35%."** Multi-row prepends `strings.rows(count)`: "5 rows. Largest change Berlin, up 41%."
**Edge cases beyond the shared matrix:** `from === to` → single dot, connector omitted, summary "No change at 62,000." (`strings.flatPair`) · `from > to` → renders identically (direction from data, not order) — regression-test both orders.
**Size budget:** static ≤ 2.0 kB / interactive ≤ 2.8 kB.
**Honesty notes:** when rendering *ranges* (min→max, confidence spans) rather than *changes*, docs require dropping `positive` — a range has no valence and coloring it green/red would invent one.
**Docs page:** Playground: pairs, positive, label, highlight. 4-context: table cell (salary bands) hero. "Why this default": hollow→filled reads as before→after without a legend.

---

### 12. PairedBars — `paired-bars`

**Collection:** core · **Data shape:** S2-referenced — `data: { label: string; value: number; ref: number }[]` · **Source:** plan/05 §3 S2 #16
**Question it answers:** "How does actual compare to expected, category by category?"
**Primary encoding:** adjacent bar lengths, zero-anchored, shared scale · **Precision:** high.
**Default render:** `viewBox="0 0 60 20"`. Per category: `value` bar (full ink, `--mc-stroke`) beside `ref` bar (`--mc-neutral` at 0.55 opacity *and* 70% width — muted by two structural cues, not color alone), `crispEdges`. Node budget: 2/pair, ≤ 5 pairs documented.
**Props beyond shared grammar:**
- `mode?: "grouped" | "overlay"` · `"grouped"` · overlay renders `ref` as a full-width ghost *behind* the value bar — halves the footprint for tight cells (shared `mode` vocabulary).
**Variants (2–6):** `mode` (grouped ↔ overlay) · `orientation` (`"vertical"` default | `"horizontal"`) · `positive` (over/under-reference valence in summary + value-bar tint when set).
**Geometry (`geometry.ts`):**
```ts
export function pairedBarsGeometry(opts: {
  width: number; height: number;
  pairs: readonly { value: number | null; ref: number | null }[];
  domain?: readonly [number, number]; gap?: number;
  mode: "grouped" | "overlay"; orientation: "horizontal" | "vertical";
}): { pairs: { valueRect: Rect; refRect: Rect }[]; baseline: number }
```
**New core needs:** none.
**Interactive entry:** pointer → pair by x-band; announces `strings.pairAt(label, value, ref)` → "East: 940 vs 1,200." ←/→ roving pairs.
**Summary (`pairedBarsSummary`):** `strings.pairs(count, gapLabel, value, ref)` (new key) → Real example: **"4 pairs. Largest gap East: 940 vs 1,200."**
**Edge cases beyond the shared matrix:** `ref` null for one pair → value bar alone, pair announced "no reference" · all refs null → dev warning, steer to MiniBar · both scales must share one zero-anchored domain across value+ref (auto: max of both).
**Size budget:** static ≤ 2.2 kB / interactive ≤ 3.0 kB.
**Honesty notes:** value and ref always share one domain (comparing bars on different scales is the cardinal grouped-bar lie); overlay ghost is always the *reference*, never the value.
**Docs page:** Playground: pairs, mode, orientation, positive. 4-context: table cell (budget vs actual per region) hero. "Why this default": grouped over overlay by default — overlap hides small over-shoots.

---

### 13. Slope — `slope`

**Collection:** core · **Data shape:** S2-paired — `data: { label: string; from: number; to: number }[]` (same record as Dumbbell; different projection: time on x) · **Source:** plan/05 §3 S2 #17
**Question it answers:** "Who rose and who fell between two moments — and did the order change?"
**Primary encoding:** line slope between two aligned columns · **Precision:** medium-high (crossings read instantly; exact deltas via labels/summary).
**Default render:** `viewBox="0 0 40 40"`. Two implicit columns at the gutter-inset left/right x; one `<line>` per category + 2 endpoint dots (r=1.5). Line ink: `--mc-neutral` default; with `positive` set, pos/neg by direction; `highlight` → accent. Label gutters both sides (ch-reserved) when `label` ≠ "none". Node budget ≤ 3/category, ≤ 7 categories documented.
**Props beyond shared grammar:**
- `highlight?: number | string` · `undefined` · the one-vs-field editorial read.
**Variants (2–6):** `label`: `"none"` (default) `| "value" | "label" | "both"` — left text `text-anchor="end"`, right `start`; rows closer than `fontSize × 1.1` drop labels deterministically (count × height, no measurement) · `positive` direction coloring · `highlight`.
**Geometry (`geometry.ts`):**
```ts
export function slopeGeometry(opts: {
  width: number; height: number;
  pairs: readonly { from: number | null; to: number | null }[];
  domain?: readonly [number, number];
  gutterLeftCh: number; gutterRightCh: number; fontSize: number;
}): { lines: { x0: number; y0: number; x1: number; y1: number; dir: 1 | -1 | 0 }[];
      leftLabelX: number; rightLabelX: number; labelsFit: boolean }
```
**New core needs:** none.
**Interactive entry:** pointer → nearest line by vertical distance at the pointer's interpolated x (pure point-to-segment math over ≤ 7 lines); announces `strings.slopeAt(label, from, to, direction, pct)` → "Berlin: 48 to 61, up 27%." ↑/↓ roving categories (ordered by `to` value).
**Summary (`slopeSummary`):** `strings.slopes(count, up, down, topLabel, topPct)` (new key) → Real example: **"5 categories: 3 up, 2 down. Largest change East, up 18%."**
**Edge cases beyond the shared matrix:** null `from` or `to` → dot-only at the known end, dashed stub, announced "incomplete" · coincident endpoints at one column → dots de-overlapped 0.5 units within band (as DotPlot) and labels dropped for the collided rows only.
**Size budget:** static ≤ 2.2 kB / interactive ≤ 3.0 kB.
**Honesty notes:** both columns share one y-domain (per-column normalization would fake convergence); a two-point line implies nothing about the path between — docs say so and steer to Sparkline for the path.
**Docs page:** Playground: pairs, label, highlight, positive. 4-context: KPI card (before/after experiment) hero. "Why this default": neutral ink until `positive` is declared — rank changes are not automatically good or bad.

---

### 14. SegmentedBar — `segmented-bar`

**Collection:** core · **Data shape:** S3 (`data: {label: string; value: number}[]`, parts of a whole) · **Source:** plan/05 §3 S3 #22
**Question it answers:** "What is this made of, and in what proportions?"
**Primary encoding:** segment length within a fixed-length bar (shares of 100%) · **Precision:** medium-high (lengths on a common baseline chain).
**Default render:** `viewBox="0 0 60 10"`. ≤ 5 segment `<rect>`s (`crispEdges`), colors `--mc-cat-1…5` in data order, 0.5-unit gaps; > 5 categories → top 4 by value + "Other" rollup (`--mc-neutral`). Direct labels when they fit (see variants). Node budget ≤ 6 + labels.
**Props beyond shared grammar:**
- `maxSegments?: number` · `5` · rollup threshold — the ≤ 5 cap is legibility-derived, and the rollup keeps honesty (nothing silently dropped).
- `order?: "data" | "desc"` · `"data"` · descending re-order for composition ranking; data order for inherent sequences (funnel-like stages use Funnel instead — documented steer).
**Variants (2–6):** `label`: `"none"` (default) `| "percent" | "value"` — centered per segment (`text-anchor="middle"`), rendered only when `segmentShare × width ≥ estChars × 0.62 × fontSize` (deterministic drop-out per segment) · `order` · `maxSegments`.
**Geometry (`geometry.ts`):**
```ts
export function segmentedBarGeometry(opts: {
  width: number; height: number;
  values: readonly number[]; gap?: number; fontSize: number;
}): { segments: { x: number; w: number; share: number; labelFits: boolean }[] }
```
**New core needs:** `stack.normalizeShares` (zero/negative filtering + share computation).
**Interactive entry:** pointer → segment by x lookup; announces `strings.shareAt(label, pct, value)` → "Safari: 24%, 1,204." ←/→ roving segments incl. "Other" (which announces its member count: "Other: 5%, 3 categories.").
**Summary (`segmentedBarSummary`):** `strings.shares(list)` (new key; list joins `label pct%` clauses) → Real example: **"Chrome 62%, Safari 24%, Firefox 9%, Other 5%."**
**Edge cases beyond the shared matrix:** negative values → excluded from the whole + dev warning (a part-to-whole cannot contain negative parts; steer to Waterfall) · zero-value segments → skipped, kept in summary as "0%" only if explicitly present · everything rolls to "Other" (> maxSegments equal tiny values) → documented.
**Size budget:** static ≤ 2.0 kB / interactive ≤ 2.8 kB.
**Honesty notes:** segments always sum to the full bar; the rollup is labeled "Other," never dropped; no donut-style rounding of shares that don't sum to 100 (largest-remainder rounding in the summary, documented).
**Docs page:** Playground: data, label, order, maxSegments. 4-context: table cell (traffic mix per row) hero. "Why this default": a flat bar beats a donut of the same data at every size we ship — shown side by side.

---

### 15. HistogramStrip — `histogram-strip`

**Collection:** core · **Data shape:** S1 (`data: number[]` — raw observations, binned internally) · **Source:** plan/05 §3 Trend #11
**Question it answers:** "What does the distribution look like?" — mode, spread, skew in a cell.
**Primary encoding:** bar height per uniform bin, zero-anchored counts · **Precision:** medium (bin-level).
**Default render:** `viewBox="0 0 60 16"`. ≤ 12 bin bars (`crispEdges`, 0.5-unit gaps, `--mc-stroke`); `highlight` bin → accent, others drop to 0.55 opacity. Node budget: 1/bin ≤ 12.
**Props beyond shared grammar:**
- `bins?: number` · auto (`min(12, ceil(sqrt(n)))`) · bin count; capped at 12 (micro legibility bound from the catalog).
- `highlight?: number` · `undefined` · a *value* (not an index) whose bin gets accent — "where you fall in the distribution."
**Variants (2–6):** `bins` · `highlight` · `domain` override (fixed bin edges across small multiples — same calibration story as HeatCell).
**Geometry (`geometry.ts`):**
```ts
export function histogramGeometry(opts: {
  width: number; height: number;
  values: readonly (number | null)[]; domain?: readonly [number, number];
  bins?: number; gap?: number;
}): { bars: { x: number; y: number; w: number; h: number; count: number; x0: number; x1: number }[];
      highlightBin: (v: number) => number }
```
**New core needs:** `bin.uniformBins` (uniform binning ≤ 12, count normalization).
**Interactive entry:** pointer → bin by x-band; announces `strings.binAt(lo, hi, count)` → "40 to 50: 34 values." ←/→ roving bins.
**Summary (`histogramSummary`):** `strings.distribution(count, modalLo, modalHi)` (new key) → Real example: **"120 values, most between 40 and 50."**
**Edge cases beyond the shared matrix:** all values identical → single full-height bin (the shared all-equal case, but binned: assert one bin, not twelve slivers) · pre-aggregated counts as input → *not supported*; docs steer to SparkBar (this chart's contract is raw observations) · n < bins → bins collapse to `n` (no empty-comb artifact).
**Size budget:** static ≤ 2.0 kB / interactive ≤ 2.8 kB.
**Honesty notes:** uniform bins only, counts zero-anchored, never density-smoothed; `highlight` marks the bin, never re-bins around the value.
**Docs page:** Playground: data, bins, highlight. 4-context: sentence ("response times cluster at ~45 ms") hero. "Why this default": √n capped at 12 — enough shape to see skew, few enough bars to survive 60 px.

---

### 16. MicroBox — `micro-box`

**Collection:** core · **Data shape:** S2 (per catalog): raw `data: number[]` *or* precomputed `stats: {min, q1, median, q3, max}` — exactly one · **Source:** plan/05 §3 S2 #18
**Question it answers:** "What are the p50 and spread of this metric?" — 5-number summary in a table row (p50/p95/p99 latency rows).
**Primary encoding:** box span (IQR) + median tick position · **Precision:** high for the five numbers, silent about modality — docs steer to HistogramStrip for shape.
**Default render:** `viewBox="0 0 40 14"`. Marks: whisker hairline (min→max, `--mc-neutral`) → IQR box `<rect>` (`--mc-band` fill + hairline stroke) → median tick `<line>` (2-unit stroke, `--mc-stroke`). Node budget ≤ 4 (+ ≤ 3 outlier dots in tukey mode, documented cap).
**Props beyond shared grammar:**
- `stats?: { min: number; q1: number; median: number; q3: number; max: number }` · `undefined` · precomputed summaries from server aggregates — the common production path; mutually exclusive with `data`.
- `whiskers?: "minmax" | "tukey"` · `"minmax"` · tukey (1.5 × IQR fences) exposes outliers as dots; minmax is the honest default when n is small.
- `outliers?: boolean` · `true` (tukey only) · cap 3 rendered per side (furthest), count carried in summary.
**Variants (2–6):** `stats` input mode · `whiskers` · `orientation` (`"horizontal"` default | `"vertical"`).
**Geometry (`geometry.ts`):**
```ts
export function microBoxGeometry(opts: {
  width: number; height: number;
  five: { min: number; q1: number; median: number; q3: number; max: number };
  outlierValues?: readonly number[]; domain?: readonly [number, number];
}): { whisker: { x0: number; x1: number; y: number };
      box: Rect; medianX: number; outliers: { x: number; y: number }[] }
```
**New core needs:** `quantile.fiveNumber`, `quantile.quantiles` (raw-data path; tukey fences).
**Interactive entry:** pointer → nearest of the five stat positions by x; announces `strings.stat(name, value)` → "Median: 42." ←/→ steps min → q1 → median → q3 → max (a fixed 5-stop roving model).
**Summary (`microBoxSummary`):** `strings.fiveNum(median, q1, q3, min, max)` (new key) → Real example: **"Median 42, middle half 35 to 51, range 12 to 96."**
**Edge cases beyond the shared matrix:** `q1 === q3` (degenerate IQR) → box collapses to a 1-unit tick, still distinct from the median tick by height · `stats` with non-monotonic values → dev error (garbage in must not render a plausible-looking lie) · n < 5 raw values → renders dots at the raw values instead of a fake box (documented).
**Size budget:** static ≤ 2.2 kB / interactive ≤ 3.0 kB.
**Honesty notes:** never render a box from fewer than 5 observations; whisker convention always stated in docs per mode; violin stays unshipped — this is its documented replacement (plan/05 §4).
**Docs page:** Playground: data/stats toggle, whiskers, outliers, orientation. 4-context: table cell (latency percentile rows) hero. "Why this default": min-max whiskers — Tukey fences imply a normality assumption most product data doesn't meet.

---

### 17. ProgressRing — `progress-ring`

**Collection:** core · **Data shape:** S3 (`value` of `max`) · **Source:** plan/05 §3 S3 #23
**Question it answers:** "How complete is this?" — at icon size, where a linear bar doesn't fit.
**Primary encoding:** arc sweep angle (fixed 12-o'clock start, clockwise) · **Precision:** medium — docs steer to `progress` when the % must be read precisely and no center label fits.
**Default render:** `viewBox="0 0 24 24"`. Track annulus `<path>` (`--mc-band`) → value arc `<path>` (accent, `stroke-linecap="butt"` — rounded caps overstate small fractions). Optional centered `<text>` (`label="percent"`, tabular-nums). Node budget ≤ 3.
**Props beyond shared grammar:**
- `value: number` · required. · `max?: number` · `1`.
- `sweep?: boolean` · `false` · wedge-fill mode (absorbs CooldownSweep, plan/21 §2 `variantOf`): renders the *remaining* fraction as a shrinking filled sector — countdown/cooldown semantics (rate limits, retry timers). Data meaning flips from "done grows" to "remaining shrinks"; summary wording follows.
- `weight?: number` · `3` · ring thickness in viewBox units (annulus legibility at 16–32 px, geometry-affecting so a prop, not CSS).
**Variants (2–6):** `sweep` (completion ↔ countdown) · `label`: `"none"` (default) `| "percent"` (center; docs note ≥ 20 px rendered size guidance) · `weight` · `positive="down"` (burn-down wording).
**Geometry (`geometry.ts`):**
```ts
export function ringGeometry(opts: {
  size: number; fraction: number; weight: number; sweep: boolean;
}): { track: string; arc: string; labelX: number; labelY: number } // SVG path d strings
```
**New core needs:** `arc.annulusArc`, `arc.sector` (integer-safe, 2-dp; full-circle fraction=1 handled without the 360°-arc degenerate).
**Interactive entry:** `live` announces at 25/50/75/100% threshold crossings only (documented anti-spam rule; `sweep` announces "30 seconds remaining"-style via `format`). Arc entrance animation stroke-dashoffset, reduced-motion-gated. No pointer lookup (single mark).
**Summary (`progressRingSummary`):** reuses `strings.progress` → Real example: **"68% complete."** Sweep mode: `strings.remaining(pct)` → "32% remaining."
**Edge cases beyond the shared matrix:** fraction 0 → track only (no zero-length arc artifact) · fraction 1 → full annulus via two half-arcs (SVG can't draw a 360° single arc) · overflow > 100% → clamps ring, true percent in label/summary (same rule as `progress`).
**Size budget:** static ≤ 1.8 kB / interactive ≤ 2.6 kB.
**Honesty notes:** start angle fixed at 12 o'clock and documented (variable starts make identical fractions look different); butt caps; never a gauge — no needle, no red zone (plan/05 §4).
**Docs page:** Playground: value, sweep, weight, label. 4-context: tab header + KPI card heroes. "Why this default": butt caps and a fixed start — the two quiet ways rings inflate progress, both removed.

---

### 18. MicroDonut — `micro-donut`

**Collection:** core · **Data shape:** S3 (`data: {label: string; value: number}[]`) · **Source:** plan/05 §3 S3 #24
**Question it answers:** "Roughly what is this made of?" — at icon size, when the number is already printed beside it.
**Primary encoding:** wedge angle · **Precision:** **low** — the docs page's first paragraph steers to SegmentedBar for any comparative read; this component exists as an honest, capped concession to a ubiquitous demand.
**Default render:** `viewBox="0 0 24 24"`. ≤ 4 annulus sector `<path>`s (`--mc-cat-1…4`) + "Other" rollup sector (`--mc-neutral`), 2° gaps, 12-o'clock start. No center label (too small; the host prints the number). Node budget ≤ 5.
**Props beyond shared grammar:**
- `maxWedges?: number` · `4` · rollup threshold (same mechanism as SegmentedBar).
- `decorative?: boolean` · `false` · the honest-framing switch: marks the chart as redundant ornament for an adjacent printed value — sets `summary={false}` semantics (aria-hidden) and docs frame the *only* sanctioned decorative use ("the number is printed next to it; the donut repeats it"). Without it, the full composition summary is the accessible name.
**Variants (2–6):** `maxWedges` · `decorative` · `weight` (shared with ProgressRing, annulus thickness).
**Geometry (`geometry.ts`):**
```ts
export function microDonutGeometry(opts: {
  size: number; shares: readonly number[]; weight: number; gapDeg?: number;
}): { wedges: { d: string; share: number; a0: number; a1: number }[] }
```
**New core needs:** `arc.annulusSector` · `stack.normalizeShares` (shared with SegmentedBar).
**Interactive entry:** pointer → wedge by angle lookup (`atan2` from center, pure); announces `strings.shareAt` reuse ("Safari: 24%, 1,204."); ←/→ roving wedges. Disabled when `decorative` (an aria-hidden chart must not be a tab stop).
**Summary (`microDonutSummary`):** reuses `strings.shares` → Real example: **"Chrome 62%, Safari 24%, Firefox 9%, Other 5%."**
**Edge cases beyond the shared matrix:** single category → full annulus (= ProgressRing at 100% visually; summary disambiguates) · negative/zero values → excluded + dev warning (as SegmentedBar) · two near-equal wedges → gap ensures separability (never rely on hue alone at 24 px; adjacency + gap carry the boundary).
**Size budget:** static ≤ 2.2 kB / interactive ≤ 3.0 kB.
**Honesty notes:** hole is mandatory (angle+arc-length double encoding of the donut beats the pie's area read; pie stays unshipped, plan/05 §4); wedge cap + labeled rollup are non-optional; never explode, tilt, or shadow.
**Docs page:** Playground: data, maxWedges, decorative, weight. 4-context: KPI card (mix icon beside the headline number) hero. "Why this default": 4 wedges max — the count a reader can hold at 24 px; and the SegmentedBar comparison demo sits directly above the fold.

---

### 19. Funnel — `funnel`

**Collection:** core · **Data shape:** S3-sequential (`data: {label: string; value: number}[]`, ordered stages) · **Source:** plan/05 §3 S3 #25
**Question it answers:** "Where does the pipeline leak?" — stage-to-stage conversion in a cell.
**Primary encoding:** column height per stage, zero-anchored; the *drop between neighbors* is the read · **Precision:** high (rect heights, no trapezoid interpolation).
**Default render:** `viewBox="0 0 60 18"`. Equal-width stage columns (heights ∝ value, zero-anchored, `crispEdges`, `--mc-stroke`), connector slats between consecutive stages (thin trapezoid `<path>`, `--mc-band`) showing the retained share. Node budget: 2/stage − 1, ≤ 6 stages documented.
**Props beyond shared grammar:**
- `mode?: "absolute" | "rate"` · `"absolute"` · rate renders each stage as % retained of the *first* stage (100% → 46% → …) — normalized cross-funnel comparison (shared `mode` vocabulary).
- `connectors?: boolean` · `true` · slats off for the tightest cells.
**Variants (2–6):** `mode` · `connectors` · `label`: `"none"` (default) `| "percent" | "value"` — above each column, `text-anchor="middle"`, deterministic drop-out below `width/stages ≥ estChars × 0.62 × fontSize` · `highlight` (accent one stage — "the leak").
**Geometry (`geometry.ts`):**
```ts
export function funnelGeometry(opts: {
  width: number; height: number;
  values: readonly number[]; mode: "absolute" | "rate";
  gap?: number; connectors: boolean; fontSize: number;
}): { stages: { x: number; y: number; w: number; h: number; share: number }[];
      slats: { d: string }[]; labelsFit: boolean }
```
**New core needs:** none (shares arithmetic is trivial; `stack` not needed).
**Interactive entry:** pointer → stage by x-band; announces `strings.stageAt(label, value, retainedPct)` → "Checkout: 2,730 — 22% of visitors." ←/→ roving stages.
**Summary (`funnelSummary`):** `strings.funnel(stages, first, last, overallPct)` (new key) → Real example: **"4 stages, 12,400 to 1,116 — overall 9%."**
**Edge cases beyond the shared matrix:** a stage larger than its predecessor (non-monotonic — re-engagement funnels) → rendered truthfully, summary appends "stage 3 exceeds stage 2" (`strings.funnelInversion`) · zero stage mid-funnel → zero-height column, later stages still render · single stage → one column, no conversion clause.
**Size budget:** static ≤ 2.2 kB / interactive ≤ 3.0 kB.
**Honesty notes:** rectangles only — the smooth tapered funnel shape interpolates data that doesn't exist; heights zero-anchored; `rate` mode always normalizes to stage 1 (documented), never to the previous stage (that hides compounding loss).
**Docs page:** Playground: stages, mode, connectors, label. 4-context: table cell (per-campaign funnels) hero. "Why this default": stepped columns over the classic funnel silhouette — the silhouette is a shape, not a measurement.

---

### 20. Waterfall — `waterfall`

**Collection:** core · **Data shape:** S2-signed-sequential (`data: {label: string; value: number}[]`, signed deltas in order) · **Source:** plan/05 §3 S2 #20
**Question it answers:** "How did the deltas compose into the total?" — P&L in a cell.
**Primary encoding:** floating bar length = each delta's magnitude, positioned at the running level · **Precision:** high.
**Default render:** `viewBox="0 0 70 18"`. Per step: floating `<rect>` (`crispEdges`; `--mc-positive`/`--mc-negative` by sign — sign is *also* encoded by vertical direction from the running level, so never color-alone) + connector hairline (`--mc-neutral`, 0.4 opacity) to the next bar. Optional final total bar from zero (`--mc-stroke`). Node budget: 2/step + 1, ≤ 7 steps documented.
**Props beyond shared grammar:**
- `start?: number` · `0` · opening level (prior-period close).
- `total?: boolean` · `true` · closing total bar anchored at zero — the one zero-anchored mark that keys the floating bars to reality.
**Variants (2–6):** `total` · `start` · `label`: `"none"` (default) `| "delta"` (signed value above/below each bar, anchor-only, drop-out below per-step width threshold as Funnel) · `positive="down"` (cost breakdowns: decreases are good — swaps token assignment and summary valence).
**Geometry (`geometry.ts`):**
```ts
export function waterfallGeometry(opts: {
  width: number; height: number;
  deltas: readonly number[]; start: number; total: boolean;
  domain?: readonly [number, number]; gap?: number;
}): { bars: { x: number; y: number; w: number; h: number; sign: 1 | -1 }[];
      connectors: { x0: number; x1: number; y: number }[];
      totalBar: Rect | null; zeroY: number; levels: number[] }
```
`levels` = running totals (2-dp) for the interactive readout.
**New core needs:** none.
**Interactive entry:** pointer → step by x-band; announces `strings.waterfallStep(label, delta, level)` → "Refunds: −140, running 1,410." ←/→ roving steps; End focuses the total.
**Summary (`waterfallSummary`):** `strings.waterfall(start, end, steps, gains, losses)` (new key) → Real example: **"From 1,200 to 1,540 over 5 steps: +480 gains, −140 losses."**
**Edge cases beyond the shared matrix:** zero delta → 1-unit tick bar at the level (visible, honest) · running level crossing zero → bars straddle correctly; containment test covers deep-negative excursions · all-negative deltas with `start=0` → domain auto-extends below zero.
**Size budget:** static ≤ 2.5 kB / interactive ≤ 3.3 kB.
**Honesty notes:** floating bars are the documented encoding exception to zero-anchoring — each bar's *length* is its own delta, exactly; the connectors and the zero-anchored total bar are mandatory keys, which is why `total={false}` is the variant and not the default.
**Docs page:** Playground: deltas, start, total, label, positive. 4-context: KPI card (monthly P&L bridge) hero. "Why this default": the total bar stays on — a waterfall without a grounded total is unverifiable.

---

### 21. BumpStrip — `bump-strip`

**Collection:** core · **Data shape:** S1 (`data: (number | null)[]` — 1-based integer ranks per period) · **Source:** plan/05 §3 Trend #9
**Question it answers:** "How did this entity's *rank* move?" (#5 → #2) — position among competitors, not magnitude.
**Primary encoding:** vertical band position over time, rank 1 at top (inverted y — documented prominently) · **Precision:** high (ranks are integers).
**Default render:** `viewBox="0 0 60 16"` plus end label gutters when labeled. Step-line `<path>` through rank bands (`--mc-stroke`, non-scaling-stroke) + dots (r=1.5, accent) at rank-*change* points only. End labels "#5"/"#2" by default (`label="ends"`): left `text-anchor="end"`, right `start`, ch-reserved gutters. Node budget ≤ 4 + change dots (documented ≤ 8).
**Props beyond shared grammar:**
- `maxRank?: number` · data max · fixes the band domain so small multiples share a rank scale (10 bands even if this entity never left the top 3).
- `dots?: "changes" | "none"` (chart enumeration of the shared `dots` prop) · `"changes"` · marks the moments rank actually moved.
**Variants (2–6):** `label`: `"ends"` (default) `| "last" | "none"` · `maxRank` (shared-scale multiples) · `dots`.
**Geometry (`geometry.ts`):**
```ts
export function bumpGeometry(opts: {
  width: number; height: number;
  ranks: readonly (number | null)[]; maxRank?: number;
  gutterCh: number; fontSize: number;
}): { d: string; points: { x: number; y: number; rank: number }[];
      changes: { x: number; y: number }[]; firstLabel: Anchor; lastLabel: Anchor }
```
**New core needs:** none.
**Interactive entry:** nearest-x pointer lookup; announces `strings.rankAt(period, total, rank)` → "Week 4 of 12: #3." ←/→ step periods.
**Summary (`bumpSummary`):** `strings.rankRun(from, to, best, periods)` (new key) → Real example: **"From #5 to #2 over 12 weeks; best #1."** Note: rank improvement wording is built in ("from #5 to #2" *is* the direction) — `positive` is ignored and documented as such (lower is always better in rank space).
**Edge cases beyond the shared matrix:** non-integer input → rounds + dev warning (ranks are ordinal) · rank 0 or negative → dev error · null periods → gap in the step line (unranked weeks) · rank > maxRank → clamped to bottom band + dev warning.
**Size budget:** static ≤ 2.0 kB / interactive ≤ 2.8 kB.
**Honesty notes:** inverted y is stated in the docs header and encoded in end labels ("#") so the read is self-keying; never interpolate diagonal lines through skipped periods — the step form declares rank as discrete.
**Docs page:** Playground: ranks, maxRank, label, dots. 4-context: sentence ("climbed #5→#2 this quarter") hero. "Why this default": step line over smooth curve — a rank cannot be 2.4.

---

### 22. DualSparkline — `dual-sparkline`

**Collection:** core · **Data shape:** S1 + reference series (`data: number[]`, `compare: number[]`) · **Source:** plan/05 §3 Trend #7
**Question it answers:** "How is this series doing *against its benchmark*?"
**Primary encoding:** two line positions on one shared scale; primary/reference differentiated by dash + weight, never color-alone · **Precision:** high.
**Default render:** `viewBox="0 0 60 16"`. Compare path first (dashed `4 2`, 1-unit stroke, `--mc-neutral`) → primary path (solid, 1.5-unit, `--mc-stroke`) → endpoint dots + labels per `label`. Domain = union of both series (always — the entire point is comparability). Node budget ≤ 6.
**Props beyond shared grammar:**
- `compare: number[]` · required · the benchmark series (without it, use Sparkline — enforced by types).
- `compareLabel?: string` · `"benchmark"` · names the reference in summaries/announcements.
**Variants (2–6):** `label="last"` labels both endpoints (coincident endpoints: dedupe to one dot + one gapped label per the chart-legibility rule — the two values are then equal and one label tells the truth) · `curve` (shared, applies to both) · `fill` (primary only — filling both stacks ink into mud) · `band` (shared grammar: normal-range band behind both).
**Geometry (`geometry.ts`):**
```ts
export function dualSparklineGeometry(opts: {
  width: number; height: number;
  primary: readonly (number | null)[]; compare: readonly (number | null)[];
  domain?: readonly [number, number]; gutterCh: number; fontSize: number;
}): { dPrimary: string; dCompare: string;
      lastPrimary: Point | null; lastCompare: Point | null; coincident: boolean }
```
Reuses `core/path` builders.
**New core needs:** none.
**Interactive entry:** nearest-x lookup announces both: `strings.vsAt(pos, total, v, ref)` → "Point 9 of 12: 17 vs 15." Crosshair overlay touches both lines; ←/→ steps x.
**Summary (`dualSparklineSummary`):** `strings.vs(primaryClause, compareClause, lastV, lastRef)` (new key, clauses from `describeSeries` internals) → Real example: **"Trending up 12% vs benchmark up 4%. Last 17 vs 15."**
**Edge cases beyond the shared matrix:** length mismatch → aligned from index 0, shorter series simply ends (documented; no stretching — stretching fakes correlation) · compare all-null → renders primary alone + dev warning steering to Sparkline · identical series → one visible line; summary states "matching benchmark."
**Size budget:** static ≤ 2.5 kB / interactive ≤ 3.4 kB.
**Honesty notes:** exactly 2 series, ever (the catalog's cap — 3+ overlapped lines at 16 px is unreadable; steer to SparkGroup small multiples); one shared domain, no dual axes, no per-series normalization.
**Docs page:** Playground: data, compare, label, curve, fill. 4-context: KPI card ("you vs plan") hero. "Why this default": dash for the benchmark — reference information should whisper.

---

### 23. StackedArea — `stacked-area`

**Collection:** core · **Data shape:** S1-multi — `data: { label?: string; values: (number | null)[] }[]` (≤ 3 series; new shape ⇒ new component) · **Source:** plan/05 §3 Trend #8
**Question it answers:** "How did the *composition* shift over time?" — share change, not individual levels.
**Primary encoding:** stacked band thickness over time, zero-anchored total · **Precision:** medium (bottom band precise; upper bands read as thickness) — docs steer to SparkGroup of Sparklines for per-series levels.
**Default render:** `viewBox="0 0 60 16"`. ≤ 3 stacked area `<path>`s bottom-up (`--mc-cat-1…3` at 0.8 opacity, hairline top strokes), zero-anchored cumulative sums. Node budget ≤ 6.
**Props beyond shared grammar:**
- `style?: "stacked" | "ridge"` · `"stacked"` · **ridge = the relocated MountainRidges look** (plan/21 §2): identical stacking math and data meaning, rendered with smooth (catmull-rom) silhouettes, fully opaque fills back-to-front, and a 1-unit highlight hairline on each crest — editorial texture, zero semantic change (shared `style` vocabulary: render styling that never changes data meaning; the visual test asserts identical stack offsets across both styles).
- `order?: "data" | "asc"` · `"data"` · ascending puts the smallest series on top where thickness distortion is least; data order preserves author intent.
**Variants (2–6):** `style` (stacked ↔ ridge) · `order` · `label="last"` (endpoint share labels "45%", right gutter, one per series, dropped below `fontSize × series` height — deterministic) · `curve` (`"linear"` default; ridge forces smooth).
**Geometry (`geometry.ts`):**
```ts
export function stackedAreaGeometry(opts: {
  width: number; height: number;
  series: readonly (readonly (number | null)[])[];
  domain?: readonly [number, number]; curve: Curve; gutterCh: number; fontSize: number;
}): { layers: { dArea: string; dTop: string; lastShare: number }[]; baselineY: number }
```
**New core needs:** `stack.stackSeries` (zero-anchored cumulative stacking, null → 0 within stack with gap markers documented) + `stack.normalizeShares` for endpoint shares.
**Interactive entry:** nearest-x lookup announces all layers: `strings.stackAt(pos, total, clauses)` → "Point 8 of 12: Mobile 45%, Web 38%, API 17%." ←/→ steps x; ↑/↓ cycles which layer the crosshair dot highlights.
**Summary (`stackedAreaSummary`):** `strings.shareShift(count, points, topLabel, topPct)` (new key) → Real example: **"3 series over 12 points; Mobile leads at 45% share."**
**Edge cases beyond the shared matrix:** negative values → dev error (a stacked composition cannot contain negatives; steer to Waterfall/Sparkline) · a series all-zero → zero-thickness layer, kept in summary at 0% · null at some x in one series → treated as 0 in the stack with the gap documented in the announcement ("Web: no data").
**Size budget:** static ≤ 2.8 kB / interactive ≤ 3.8 kB.
**Honesty notes:** ≤ 3 series hard cap (thickness reading degrades combinatorially); total always zero-anchored; ridge changes rendering only — assert stack offsets byte-identical between styles in tests.
**Docs page:** Playground: series, style, order, label, curve. 4-context: KPI card (traffic mix over 12 weeks) hero. "Why this default": linear stacked over ridge — ridge is the editorial variant you choose, not the analytical default.

---

### 24. Ohlc — `ohlc`

**Collection:** core · **Data shape:** structured — `data: { open: number; high: number; low: number; close: number }[]` · **Source:** plan/05 §3 Trend #6
**Question it answers:** "What did each period's range and settlement look like?" — financial table rows.
**Primary encoding:** high-low extent + open/close marks per period · **Precision:** high.
**Default render:** `viewBox="0 0 80 16"`, ≤ 20 periods (hard, from the catalog). Default `style="candle"`: high-low wick `<line>` + open-close body `<rect>` per period; **up periods hollow body / down periods filled** (direction is shape-coded; `--mc-positive`/`--mc-negative` reinforce, `positive` prop ignored — market up/down semantics are fixed and documented). Node budget: 2/period ≤ 40 (documented N-mark exception, per-period budget 2).
**Props beyond shared grammar:**
- `style?: "candle" | "bars"` · `"candle"` · bars = classic tick style (open tick left, close tick right on the wick) — denser rows, print-friendly (shared `style` vocabulary; same data meaning).
- `maxPeriods?: number` · `20` · renders the **most recent** N with a dev warning when input exceeds it (never silently averages periods — OHLC cannot be downsampled without lying).
**Variants (2–6):** `style` (candle ↔ bars) · `label="last"` (last close, right gutter, tabular-nums) · `maxPeriods`.
**Geometry (`geometry.ts`):**
```ts
export function ohlcGeometry(opts: {
  width: number; height: number;
  periods: readonly { open: number; high: number; low: number; close: number }[];
  domain?: readonly [number, number]; gutterCh: number; fontSize: number;
}): { marks: { x: number; yH: number; yL: number; yO: number; yC: number; up: boolean; bodyW: number }[] }
```
**New core needs:** none.
**Interactive entry:** nearest-x lookup; announces `strings.ohlcAt(pos, total, o, h, l, c)` → "Period 18 of 20: open 145.10, high 149.30, low 144.00, close 148.20." ←/→ steps periods.
**Summary (`ohlcSummary`):** `strings.ohlcRun(n, close, changePct, lo, hi)` (new key) → Real example: **"20 periods. Last close 148.20, up 3.4%; range 141.10 to 151.90."**
**Edge cases beyond the shared matrix:** `high < low` or open/close outside [low, high] → dev error (corrupt market data must not render plausibly) · doji (open === close) → 1-unit body tick, still hollow/filled by prior-close comparison? No — flat body renders neutral (`--mc-neutral`), announced "unchanged" · single period → one candle, no change clause.
**Size budget:** static ≤ 2.5 kB / interactive ≤ 3.4 kB.
**Honesty notes:** domain fits [min(low), max(high)] exactly (data-fit is correct here — price charts are position reads, documented like Sparkline's baseline note); never gap-fill missing periods; the ≤ 20 cap is the honesty gate against turning this into a full price chart.
**Docs page:** Playground: periods, style, label. 4-context: table cell (watchlist rows) hero. "Why this default": hollow/filled bodies survive grayscale print and colorblindness where green/red candles fail.

---

### 25. Horizon — `horizon`

**Collection:** core · **Data shape:** S1 (`data: (number | null)[]`) · **Source:** plan/05 §3 Trend #5
**Question it answers:** "How does a wide-range series behave inside a 14-px row?" — the canonical micro-density technique; flagship of this batch.
**Primary encoding:** area position folded into layered opacity bands (2–3 folds); darker = further from baseline · **Precision:** medium (band-quantized) — docs steer to Sparkline when exact shape matters and height allows.
**Default render:** `viewBox="0 0 80 14"`. Per fold: a clipped area `<path>` translated back into the band, positive folds in accent at stepped opacity (0.35/0.65/0.9), negative folds in `--mc-negative` at the same steps, mirrored up from the baseline (default `mode="mirror"`). One shared `<clipPath>`. Node budget ≤ 7 (folds × sign + clip), documented max (this chart holds the batch's high-water node count).
**Props beyond shared grammar:**
- `folds?: 2 | 3` · `2` · band count: each fold doubles/triples effective vertical resolution; 3 folds only when the range genuinely spans it (docs show the decision rule: `range / height > 4` → consider 3).
- `mode?: "mirror" | "offset"` · `"mirror"` · the two standard negative treatments: mirror flips negatives upward (denser, default); offset renders negatives as downward bands from a mid baseline (preserves up/down instinct at half resolution). Shared `mode` vocabulary — this is a data-reading switch, and both are documented with the same series rendered twice.
- `baseline?: number` · `0` · fold origin (e.g. a target level, so bands encode distance-from-target).
**Variants (2–6):** `folds` (2/3) · `mode` (mirror/offset) · `baseline`.
**Geometry (`geometry.ts`):**
```ts
export function horizonGeometry(opts: {
  width: number; height: number;
  values: readonly (number | null)[]; baseline: number;
  folds: 2 | 3; mode: "mirror" | "offset"; domain?: readonly [number, number];
}): { bands: { d: string; fold: number; sign: 1 | -1 }[]; clip: { x: number; y: number; w: number; h: number } }
```
Band paths are the full area path recomputed per fold offset (pure, 2-dp), clipped to the strip.
**New core needs:** none (reuses `core/path.areaPath`; folding math lives in geometry).
**Interactive entry:** essential here (the encoding is learned): nearest-x crosshair announces the *true* value, not the band: `strings.point` reuse → "Point 30 of 90: −12." Hover also raises a value dot at the folded position; ←/→ steps x.
**Summary (`horizonSummary`):** reuses `describeSeries` (values are ordinary S1 data; folding is presentation). Real example: **"Trending up 34%. Range −12 to 96. Last value 88."**
**Edge cases beyond the shared matrix:** all values within fold 1 → renders exactly like a one-band area (no phantom dark bands) · values exactly at a fold boundary → belong to the lower fold (half-open bands, property-tested) · all-negative series in mirror mode → entire strip in negative hue, mirrored — assert containment.
**Size budget:** static ≤ 2.5 kB / interactive ≤ 3.4 kB.
**Honesty notes:** fold count and mode must be visually inferable — docs require the band legend-free key (opacity ramp shown in the page, not in the chart); never auto-switch folds based on data (same series must render identically across rows); baseline ≠ 0 must be authored, never inferred.
**Docs page:** Playground: data, folds, mode, baseline. 4-context: table cell (server-fleet rows) hero — the density argument made visible. "Why this default": 2 folds mirror — the variant readers decode fastest without training, per the horizon literature's own findings (stated plainly, no citations in the page).

---

### 26. CalendarStrip — `calendar-strip`

**Collection:** core · **Data shape:** structured — `data: { date: string | Date; value: number }[]` (ISO strings or Dates; date-indexed, not slot-indexed) · **Source:** plan/05 §3 Matrix #33
**Question it answers:** "What did the last few weeks actually look like, day by day?" — week-aligned recent activity where real calendar position matters (weekday rhythm).
**Primary encoding:** discrete color step per real calendar day · **Precision:** low per-day, high for rhythm — steer to ActivityGrid for longer ordinal histories.
**Default render:** `viewBox="0 0 56 32"` at default `weeks=4`: 7 columns (days, week starts per `weekStart`) × N week rows, cell 7 + gap 1 (integer grid). Cells: value days at stepped accent (shared step scale), zero days at `--mc-band`, days absent from data render empty, future days blank. Node budget: 1/cell ≤ 56 (`weeks ≤ 8` documented cap — beyond, ActivityGrid).
**Props beyond shared grammar:**
- `weeks?: number` · `4` · window length in whole weeks ending at `end`.
- `end?: string | Date` · today (UTC) · last day of the window — pinned in tests/docs (never a live "now" inside render: determinism, SSR/hydration).
- `weekStart?: 0 | 1` · `1` (Monday) · locale start-of-week, passed to `core/calendar`.
- `steps?: number` · `5` · `shape?: "square" | "round" | "dot"` · `"square"` · shared cell vocabulary.
**Variants (2–6):** `weeks` (window) · `weekStart` · `shape` · `steps`.
**Geometry (`geometry.ts`):**
```ts
export function calendarStripGeometry(opts: {
  width: number; height: number; weeks: number;
  end: Date; weekStart: 0 | 1;
  entries: ReadonlyMap<string, number>; // ISO date → value
  domain?: readonly [number, number]; steps: number; shape: CellShape;
}): { cells: { x: number; y: number; w: number; h: number; rx: number;
               date: string; step: number | null; state: "value" | "zero" | "empty" | "future" }[] }
```
**New core needs:** `calendar.weekGrid` (UTC week/month math, `weekStart` param — the Batch-0 module; ActivityGrid's retrofit shares it). Date formatting via the new cached `makeDateFormatter` (see shared conventions).
**Interactive entry:** pointer → cell by grid lookup; 2-D arrow-key nav (←/→ day, ↑/↓ week — ActivityGrid parity, same focus-ring overlay); announces `strings.dayAt(dateLabel, value)` → "Tuesday, June 24: 12."
**Summary (`calendarStripSummary`):** `strings.calendar(activeDays, totalDays, weeks)` (new key) → Real example: **"Active 18 of 28 days over 4 weeks."**
**Edge cases beyond the shared matrix:** duplicate dates → summed + dev warning · dates outside the window → ignored silently (documented — feeds can overfetch) · invalid date strings → dev error · DST/timezone: all math UTC (property test: same input renders identically in any host TZ) · `weeks=1` → single row.
**Size budget:** static ≤ 2.5 kB / interactive ≤ 3.4 kB.
**Honesty notes:** empty ≠ zero — a day with no record renders visibly different from a day with value 0 (the Grafana bug class, applied to calendars); future days are blank, never extrapolated.
**Docs page:** Playground: weeks, weekStart, shape, steps, end. 4-context: KPI card (habit/deploy cadence) hero. "Why this default": Monday start + 4 weeks — one glance covers a month of weekday rhythm without scrolling history.

---

### 27. EventTimeline — `event-timeline`

**Collection:** core · **Data shape:** structured — `data: { start: number | Date; end?: number | Date; label?: string; kind?: "neutral" | "positive" | "negative" | "accent" }[]` — `end` present = span, absent = point event (one array, unified) · **Source:** plan/05 §3 Matrix #34
**Question it answers:** "What happened when, and for how long?" — uptime windows, on-call shifts, release spans + incident points on one row.
**Primary encoding:** span extent on a time axis; point events as position marks · **Precision:** high.
**Default render:** `viewBox="0 0 80 12"`. Marks (z-order): track hairline (`--mc-band`) → span `<rect>`s (mid-lane, height 6, `crispEdges`, kind-token fill at 0.85 opacity; overlaps render in data order at 0.7 opacity — documented) → point-event diamonds (rotated 2.5-unit squares — a *shape* distinct from spans, never size-alone) → optional `now` tick. Node budget: 1/item + 2, ≤ 12 items documented.
**Props beyond shared grammar:**
- `domain?: readonly [number | Date, number | Date]` (shared name, time-typed here) · data extent · the window; fixing it across rows is the small-multiples contract.
- `now?: number | Date` · `undefined` · current-moment tick (hairline, `--mc-accent`) — "where are we in the window"; authored, never implicit (determinism).
- `kind` per item (see data shape) · `"neutral"` · semantic ink: negative = downtime/incident, positive = healthy window, accent = highlighted span.
**Variants (2–6):** `now` marker · `kind` semantics (state-colored ops rows) · `label`: `"none"` (default) `| "spans"` — span labels centered inside, rendered only when `spanWidth ≥ estChars × 0.62 × fontSize` (deterministic, anchor-only; dropped labels are recoverable via interaction/summary).
**Geometry (`geometry.ts`):**
```ts
export function eventTimelineGeometry(opts: {
  width: number; height: number;
  items: readonly { start: number; end?: number }[]; // ms epoch, pre-normalized by the component
  domain: readonly [number, number]; fontSize: number;
}): { spans: { x0: number; x1: number; y: number; h: number; i: number; labelFits: boolean }[];
      points: { x: number; y: number; i: number }[];
      nowX: number | null; coverage: number } // coverage = merged-span fraction of window, 2-dp
```
**New core needs:** none new (interval merging for `coverage` lives in geometry; `makeDateFormatter` shared with calendar-strip).
**Interactive entry:** pointer → nearest item by x (span hit = containment, else nearest edge/point); announces spans `strings.spanAt(label, startLabel, endLabel, duration)` → "Deploy freeze: Jun 3, 09:00 to 13:30 — 4h 30m." and points `strings.eventAt(label, atLabel)` → "Incident: Jun 3, 11:12." ←/→ cycle items chronologically; Home/End first/last.
**Summary (`eventTimelineSummary`):** `strings.timeline(spans, events, coveragePct)` (new key) → Real example: **"4 spans covering 82% of the window; 2 events."**
**Edge cases beyond the shared matrix:** zero-duration span (`start === end`) → rendered as a point event + dev warning · items outside `domain` → clipped to the window edge with a flat-cut end (partially visible = honest truncation), fully-outside items dropped from render but counted in summary only if overlapping — fully outside = excluded + dev warning · reversed `start > end` → dev error · mixed Date/number inputs → normalized to ms epoch up front.
**Size budget:** static ≤ 3.0 kB / interactive ≤ 4.0 kB (batch maximum; hard caps).
**Honesty notes:** duration is length on a linear time axis — never log/compressed time; overlap opacity is a legibility device, not an encoding (the announcement carries exact intervals); `coverage` counts merged intervals (overlaps never double-count).
**Docs page:** Playground: items editor, domain, now, label, kind. 4-context: table cell (per-service uptime row) hero. "Why this default": diamonds for instants, rects for durations — the type distinction survives 12 px where color coding wouldn't.

---

### 28. Annotations entry — `@microcharts/react/annotations`

**Collection:** shared layer (not a chart type; composite helper per plan/05 §3) · **Data shape:** n/a — declarative children for every S1/S2 host · **Source:** plan/05 §3 composite helpers · plan/04 §1/§2.8
**Question it answers:** "What should the reader compare the data against?" — reference context (limits, moments, target ranges, one narrated point) with muted ink, identical inside every host.

**Components & props** (each also accepts `label?: string`, `color?: string`):
- `<Threshold y={number}>` — horizontal reference hairline at a data-space y. Dashed `2 2`, `--mc-neutral` at 0.7 opacity, non-scaling-stroke. Label anchor: `text-anchor="end"` at the right edge, y clamped by ascent.
- `<TargetZone y={[lo, hi]}>` — reference band `<rect>`, `--mc-band` fill, no stroke, **lowest z-order** (behind all data ink, per the design checklist). Label as Threshold, centered vertically in the band.
- `<Marker x={number} label? celebrate?>` — vertical moment mark at a data-space x (S1: index or x-value; S2: category index — host documents which). Hairline + 1.5-unit dot at the data point when the host exposes one. Label above, `text-anchor="middle"`, deterministic edge flip to `start`/`end` within `estChars × 0.31em` of either edge (pure arithmetic, no measurement).
- `<Marker celebrate>` — the relocated ConfettiBurst (plan/21 §2 `variantOf: marker`): 6 deterministic particles (positions/angles from `core/jitter` seeded by `x` + host size — never `Math.random`; SSR/visual-test stable) that play a one-shot CSS-keyframe burst on entrance, `prefers-reduced-motion` → particles render statically at rest positions as a subtle starburst glyph. Earned-moment framing in docs: milestone crossings only. Node budget +6, documented.
- `<Callout x={number} y?: number label>` — one narrated point: dot + short text with a 45° elbow hairline. Label side flips by the same edge arithmetic. The only annotation whose text is the point.

**Mechanism (static-safe, no context, no ids):** annotation components render `null` on their own (dev-warn if mounted outside a host). Each is branded via a static field on the component function (`Threshold[ANNOTATION] = "threshold"`, shared symbol from `shared/annotations.ts`). Hosts call the shared resolver:
```ts
export function resolveAnnotations(
  children: ReactNode,
  frame: { x: (dx: number) => number; y: (dy: number) => number;
           width: number; height: number; fontSize: number },
): { annotations: ReactNode; rest: ReactNode }
```
The resolver walks `children`, matches branded element types, and renders the marks itself from their props + the host's scale frame (2-dp); everything else passes through as `rest` (escape hatch preserved). This keeps annotations hook-free, RSC-safe, and identical across hosts — no cloneElement of consumer nodes, no context, no ids. `TargetZone` marks are returned separately ordered so hosts can slot them below data ink (`annotations.under` / `annotations.over` split in the returned node structure).

**Host contract (this batch):** every S1/S2 chart in this doc plus the shipped Sparkline/SparkBar (retrofit PR — today they render raw `children` only) provides a `frame` and splices `under`/`over` around its data marks. S3/S4 and structured charts (progress family, donut, status, timeline, calendar) do not take annotations in v1 — documented per chart page. Marker-x semantics (index vs x-value vs category) documented in each host's page.

**Summary interaction:** annotations never mutate the auto summary (the data description stays pure). A labeled Threshold/TargetZone/Marker is announced in interactive entries when crossed/focused (`strings.annotation(label, value)` → "Threshold SLA: 50."). Authors narrating annotations statically pass an explicit `summary` string — documented pattern.

**New core needs:** `jitter.seeded` (celebrate particles).
**Edge cases:** annotation coords outside the host domain → clamped to the edge and rendered at 0.4 opacity (visibly "off-scale," never silently dropped) · annotation with no host frame → renders nothing + dev warning · celebrate under reduced-motion → static glyph (asserted in the browser test).
**Size budget:** `./annotations` static ≤ 1.5 kB gzip; no interactive subpath (annotations are static marks; retriggering celebrate is a host-client concern via React `key`).
**Registration:** own exports/tsdown/size-budget entries per plan/21 §5; tests: resolver unit tests (node) + one host-integration render per component + containment (label estimates ≤ viewBox) + celebrate determinism (two renders, identical output).
**Docs page:** dedicated "Annotations" guide page + a live block inside every host chart's page; Playground on the guide (host = Sparkline, toggles per component). "Why this default": reference ink whispers — annotations sit at 0.7 opacity or below so the data never competes with its context.

---

---

### 29. MicroScatter — `micro-scatter` (ADDED 2026-07-08 · wave W3)

**Collection:** core · **Data shape:** S1-XY, unordered pairs (`data: {x: number; y: number}[]`) · **Source:** plan/05 §3 #35 (added 2026-07-08; provenance plan/12 §catalog-expansion)
**Question it answers:** "Are these two variables related?" — the relationship story no other type tells (QuadrantDot = one value against a field; PhaseTrace = time-connected trajectory).
**Primary encoding:** 2-D position on common scales · **Precision:** high — scatterplots are the highest-precision correlation display (Harrison et al. InfoVis 2014; cited in plan/12), position is the top-ranked perceptual channel.
**Default render:** `viewBox="0 0 40 24"`. Marks (z-order): optional trend hairline (`data-mc-ink="band"`, muted) → dots `r=1.5` (`data-mc-ink="point"`, `fill-opacity 0.75` so overlap reads as density) → optional focal dot accent. ≤ 60 points documented cap (N-mark exception, plan/21 §1); beyond that docs steer to HeatCell grids / binned forms. Tokens: `--mc-stroke` dots, `--mc-accent` focal, `--mc-band` trend.
**Props beyond shared grammar:**
- `xDomain?: [number, number]` · data min/max · scatter is the one core type with two value axes; `domain` keeps its grammar meaning (y), `xDomain` mirrors it for x.
- `trend?: boolean` · `false` · least-squares line across the cloud — turns "is there a pattern?" into "which way and how steep"; linear only, never smoothed.
- `focal?: number` · `undefined` · index of one accented point — "this one, among all of them" (sentence/KPI contexts).
- `r?: number` · `1.5` · dot radius in viewBox units; bounded [1, 3] — density tuning for 10 vs 60 points, clamped so dots stay dots.
**Variants (2–6):** `trend` (cloud → direction + steepness) · `focal` ("you are here") · `label="focal"` (formatted `(x, y)` pair beside the focal dot, right-gutter reserved) · `r` density tuning.
**Geometry (`geometry.ts`):**
```ts
export function microScatterGeometry(opts: {
  width: number; height: number;
  points: readonly { x: number; y: number }[];
  xDomain?: readonly [number, number]; yDomain?: readonly [number, number];
  trend: boolean;
}): {
  dots: { x: number; y: number }[];                 // finite pairs only, 2-dp
  trendLine: { x1: number; y1: number; x2: number; y2: number } | null; // least squares, clipped to plot
  r: number | null;                                  // Pearson r over finite pairs, 2-dp (null if n < 3 or zero variance)
}
```
**New core needs:** none — least-squares + Pearson r live in this geometry (pure, property-tested: r ∈ [−1, 1], trend within bounds, NaN pairs dropped).
**Interactive entry:** one pointer listener; nearest point by squared Euclidean distance on the precomputed dot array; ←/→ steps points ordered by x, announces the formatted pair ("Point 12 of 24: 3.1, 88."). Focus ring overlay on the active dot.
**Summary (`microScatterSummary`):** `strings.relationship` templates keyed on |r| tiers (≥ 0.7 strong / ≥ 0.4 moderate / ≥ 0.2 weak / else none — documented heuristic, not a statistical claim). Real example: **"24 points. Strong positive relationship (r 0.82)."** n < 3 or degenerate variance: **"2 points."** (no relationship claim).
**Edge cases beyond the shared matrix:** pairs with NaN/±Infinity in either coordinate dropped (documented, count reflected in summary) · all points coincident → one dot, no trend, no r · vertical/horizontal clouds (zero variance on one axis) → dots render, r null, no trend · duplicate points overlap by design (opacity accumulates as density — never jittered: position is the encoding).
**Size budget:** static ≤ 2.4 kB / interactive ≤ 3.2 kB.
**Honesty notes:** trend is least-squares linear only; the summary states r whenever a relationship word is used (claim and evidence travel together) · axes are unlabeled at this scale, so `title` must name both variables — docs page shows the pattern and the a11y test asserts it in examples · no log scaling, ever, without it being the user's own data transform.
**Docs page:** Playground: data, trend, focal, label, r. 4-context: sentence hero ("latency vs error rate `⣿` correlate strongly"). "Why this default": dots at 75% opacity so overplot reads as density instead of lying by occlusion.

---

### 30. LikertStrip — `likert-strip` (ADDED 2026-07-08 · wave W4, after SegmentedBar)

**Collection:** core · **Data shape:** S2-ordinal → diverging composition (`data: {label: string; value: number}[]`, ordered most-negative → most-positive, 2–7 levels; odd count ⇒ middle level = neutral) · **Source:** plan/05 §3 #36 (added 2026-07-08; provenance plan/12 §catalog-expansion)
**Question it answers:** "Does the response lean agree or disagree — and how hard?" — valence + balance that SegmentedBar (unvalenced composition) cannot say.
**Primary encoding:** signed segment length from a center line · **Precision:** medium — inner-segment lengths off the center axis read approximately; docs steer to MiniBar when exact per-level values matter.
**Default render:** `viewBox="0 0 60 12"`. Marks (z-order): center hairline (`data-mc-ink="accent"`, muted) → negative-side segments leftward (graded `--mc-negative`, opacity steps toward the pole per plan/16 graded-ink lineage) → positive-side rightward (graded `--mc-positive`) → neutral split half-left/half-right in `--mc-neutral` → end labels (net agree % right, disagree % left) in reserved ch gutters. Node budget ≤ 10 (≤ 7 segments + hairline + 2 labels; documented).
**Props beyond shared grammar:**
- `neutral?: "split" | "omit"` · `"split"` · split = Heiberger–Robbins canonical placement (half each side); omit = neutral excluded from the bar but ALWAYS still labeled ("14% neutral") — the documented answer to the known critique that center-split neutral distorts pole comparison. Never silently dropped.
- `mode?: "share" | "count"` · `"share"` · counts normalized to % (share) or rendered as raw counts on a fixed max (count) for same-denominator rows.
- `label?: "ends" | "net" | "none"` · `"ends"` · ends = agree/disagree %; net = single signed score (%pos − %neg, formula documented in the label's title).
**Variants (2–6):** `neutral` handling (both cited positions supported honestly) · `label` (ends → net score for dense tables) · `mode` (share vs count) · multi-question comparison via `SparkGroup` (shared center + scale across rows — the Heiberger–Robbins comparison case).
**Geometry (`geometry.ts`):**
```ts
export function likertStripGeometry(opts: {
  width: number; height: number;
  values: readonly number[];          // ordered neg → pos
  neutralIndex: number | null;        // middle index when odd length, else null
  neutral: "split" | "omit"; mode: "share" | "count"; max?: number;
}): {
  segments: { x: number; width: number; level: number; side: -1 | 0 | 1 }[];
  centerX: number;
  shares: { negative: number; positive: number; neutral: number }; // 0–1, 2-dp
}
```
**New core needs:** `stack.divergingStack` (Batch 0 kernel, plan/21 §6.0.C).
**Interactive entry:** pointer → segment by x-band lookup; announces level ("Agree: 34%, level 4 of 5."); ←/→ steps levels in data order; live region via `strings` keys shared with segmented-bar where identical.
**Summary (`likertSummary`):** real example: **"62% agree, 24% disagree, 14% neutral. Leans positive."** Even-level data omits the neutral clause; |net| < 5 pts reads "Balanced." (threshold documented).
**Edge cases beyond the shared matrix:** even level count (no neutral) → halves meet at center exactly · all-neutral → centered neutral block, summary "All responses neutral." · zero-total row → empty track + summary "No responses." · levels > 7 rejected in dev (legibility bar, mirrors SegmentedBar's ≤ 5 rule) · negative counts invalid → treated as 0, dev-warned.
**Size budget:** static ≤ 2.2 kB / interactive ≤ 3.0 kB.
**Honesty notes:** neutral is never hidden — `omit` removes it from the bar geometry but the label and summary always carry it · graded opacity encodes ordinal distance from neutral, never magnitude · both the Heiberger–Robbins recommendation and the Datawrapper critique are cited on the docs page; the chart takes no silent side (the prop is the argument).
**Docs page:** Playground: data, neutral, label, mode. 4-context: table cell hero (survey question rows in a SparkGroup, shared scale). "Why this default": the center line is the question; everything else is the answer.

## Batch-level risks & open questions

1. **Annotations retrofit touches shipped charts.** Sparkline/SparkBar currently pass `children` straight through; adopting `resolveAnnotations` changes their render tree. Land the annotations entry + retrofit *first in wave W4*, verify visual baselines are additive-only (existing baselines unchanged when no annotation children present).
2. **`SummaryStrings` growth.** This batch adds ~25 template keys to one interface. Risk: interface churn breaking early localizers. Mitigation: group new keys behind per-shape sub-objects (`strings.s2`, `strings.s3`, …) in the first S2 PR (mini-bar) and settle the shape there — surface it for review at that PR, not at the end.
3. **Existing canon violation found while speccing — RESOLVED 2026-07-08:** `src/charts/bullet/geometry.ts:53` used `Array.prototype.toSorted` (ES2023, crashes Safari < 16.4; forbidden by the ES2022 floor). Fixed same day via a spun-off task (→ `.sort()` on the freshly filtered array, tests green). Batch 0 still adds the targeted lint/grep CI guard so Batch 1's 29 geometry files can't reintroduce the class.
4. **`style="ridge"` semantics.** Plan/21 §3 defines `style` as never changing data meaning; the historical MountainRidges was an *overlaid* (non-stacked) form. This spec resolves the conflict by defining ridge as identical stacking with editorial rendering (see #23) — if anyone wants true overlaid ridges later, that's a new component, not this variant. Flagging per the working rule since it narrows plan/15's original form.
5. **Two structured data shapes debut here** (ohlc, event-timeline/calendar-strip records). They set the precedent Batch 2/4 structured types will follow — review their TS record naming (`OhlcDatum`, `TimelineItem`, `CalendarEntry`) at first PR with extra care; renames after Batch 2 ships are breaking.
6. **Date handling enters the kernel surface** (`makeDateFormatter`, UTC calendar math). Property-test TZ invariance early; this is the likeliest source of SSR/client hydration drift in the batch.
7. **Node-budget outliers:** heat-strip/calendar-strip (per-cell) and event-timeline (per-item) rely on the documented N-mark exception (plan/21 §1); their caps (60 cells / 56 cells / 12 items) must appear in each docs page, not just tests.
8. **Open question — annotation x-semantics on S2 hosts:** Marker at a *category* (index) vs at a *value* on the value axis differs per orientation. Current spec: Marker x always addresses the host's primary axis (index/category), Threshold y always the value axis; charts with horizontal value axes (dumbbell, dot-plot rows) map Threshold to a vertical value line — resolver handles via the host frame, but confirm the wording reads sanely in each host's docs before W4 ends.
