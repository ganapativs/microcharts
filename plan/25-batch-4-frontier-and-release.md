# 25 — Batch 4: Frontier collection (21 types) + Release sync & pitch

> **EXPANDED 2026-07-08 (96 → 100, plan/21 header):** +§21 ConfusionGrid (spec before Part B; provenance plan/12 §catalog-expansion). Counts updated 20 → 21; station-glyph stays last among charts.

> Status: **Batch 4 spec** · 2026-07-08 · template/checklist in [21-full-catalog-buildout.md](21-full-catalog-buildout.md)
> (§4 spec template, §3 variant policy, §5 registration checklist, §8 standing rules — referenced, not restated).
> Source catalog: [17-frontier-charts.md](17-frontier-charts.md) (F1–F20, admission bar, rejection ledger).
> Release half governed by [20-discoverability.md](20-discoverability.md) §10/§14/§15/§17.

## 0. Overview

Batch 4 closes the catalog: the 21 frontier types absorbed from professional instrument panels,
medicine, media tooling, AI products, trading, and observability — then the release gate for the
whole buildout. Flagships (highest usage-breadth, per plan/17 roadmap note): **tape-gauge,
token-confidence, time-in-range, waveform, hypnogram, trace-fold, calibration-strip**.
**station-glyph is the halo piece and is scheduled last among charts** — it lands on a finished
grammar, not the other way round. Implementation order below is simple → complex per plan/21 §7;
each chart is one PR-sized unit satisfying plan/21 §5. Kernel dependencies are restricted to the
Batch 0 modules (plan/21 §6.0.C: `quantile`, `bin`, `arc`, `stack`, `downsample`, `calendar`,
`jitter`) — anything else lives in the chart's own `geometry.ts`. Every type honors the plan/17
admission bar: honest documented channel, read-back without training (or a 1-line key),
≤ 200×60 px, unique data story. Part B is the buildout's final gate: README/npm/GitHub/docs-stats/
OG/llms sync + Checkpoint 3, all against measured numbers only.

---

## Part A — the 21 frontier types (implementation order)

### 1. TimeInRange — `time-in-range`
**Collection:** frontier · **Data shape:** structured (`{ severeBelow?: number; below: number; in: number; above: number; severeAbove?: number }` — counts or fractions, auto-normalized) · **Source:** plan/17 F6
**Question it answers:** how much of the period was the metric inside its acceptable corridor — and which side did it miss on?
**Primary encoding:** length (stacked shares) · **Precision:** high
**Default render:** viewBox `0 0 80 12`. Z-order: zone rects in **fixed semantic order** left→right `severeBelow → below → in → above → severeAbove` (order is positional grammar, never sorted by size), hairline gaps between zones, `%` label for the in-range zone anchored inside/above it (plan/18 anchor rules, drop-out below ~48 viewBox units of zone width). `crispEdges` on all rects. Nodes: 3–5 rects + ≤ 3 texts. Tokens: `--mc-pos` (in), `--mc-neg` (below tiers), `--mc-warn`-family (above tiers); tier severity via darker shade of the same hue + position — never color-alone (fixed order carries the reading).
**Props beyond shared grammar:**
- `data: TimeInRangeDatum` · required · counts or fractions; geometry normalizes (sums to 1).
- `orientation?: "horizontal" | "vertical"` · `"horizontal"` · vertical matches the clinical-column convention and fits KPI cards.
- `label?: "in" | "all" | "none"` · `"in"` · the in-range % is the headline read; `"all"` for audit contexts.
**Variants (4):** `orientation="vertical"` → clinical/KPI column · `label="all"` → per-zone audit read · five-zone (data-driven: optional `severe*` keys present) → severity tiers without a new component · `<Threshold>` child at a goal share → target-vs-actual corridor compliance.
**Geometry (`geometry.ts`):** `timeInRangeGeometry(opts: { data: TimeInRangeDatum; width: number; height: number; orientation: "horizontal" | "vertical"; gap?: number }): { zones: { key: ZoneKey; x: number; y: number; width: number; height: number; share: number }[] }` — uses `core/stack.ts` normalized shares; 2-dp.
**New core needs:** `stack.normalizedShares` (Batch 0).
**Interactive entry:** pointer → zone lookup by x (or y) range; hover/focus announces `"{zone}: {pct}"` via live region; ArrowLeft/Right (or Up/Down vertical) roves zones. Composes the static component with a focus-ring rect overlay as children.
**Summary (`timeInRangeSummary`):** `"{in}% in range, {below}% below, {above}% above."` (severe tiers appended when present). Example: **"72% in range, 9% below, 19% above."**
**Edge cases beyond the shared matrix:** all zeros → empty track + summary "No data."; one zone = 100% → single rect, label still renders; fractions not summing to 1 → normalized (documented); negative counts → treated as invalid per shared matrix.
**Size budget:** static ≤ 1.5 kB / interactive ≤ 2.5 kB.
**Honesty notes:** zone order is semantic and immutable — never reordered, never sorted by magnitude (plan/17 F6). Percent labels round to integers; summary and label always agree.
**Docs page:** Playground knobs: data sliders per zone, orientation, label mode, five-zone toggle · 4-context: uptime in a sentence, SLO table cell, glucose-style KPI card, environment tab health · why-default: horizontal + in-only label = one-number headline with positional detail on the second read.

### 2. Hypnogram — `hypnogram`
**Collection:** frontier · **Data shape:** structured (`{ t: number; state: string }[]` — state holds from `t` until the next entry; last state holds to `domain[1]`) · **Source:** plan/17 F8
**Question it answers:** which discrete state was the system in over time, and how choppy were the transitions?
**Primary encoding:** position (y = state level, x = time) · **Precision:** high (state identity), medium (duration read)
**Default render:** viewBox `0 0 120 24`. Right-angle step strip: one horizontal segment per run at its state's row, thin vertical connectors at transitions. **Refuses interpolation** — no diagonals, no curves, ever; runs are drawn as one `<path>` (H/V commands only), connectors included → 1–2 nodes. Row order: `states` prop top→bottom; default = first-appearance order (documented: pass explicit order for ordinal states). Optional row guide hairlines. Tokens: single `--mc-accent` ink; `emphasis` state uses full accent, rest muted.
**Props beyond shared grammar:**
- `states?: string[]` · first-appearance order · fixes the vertical row order (ordinal semantics live here).
- `emphasis?: string` · none · accents one state (e.g. Deep, or "incident") — the decision read.
- `connectors?: boolean` · `true` · vertical transition strokes; off for ultra-dense strips.
- `style?: "steps" | "lanes"` · `"steps"` · lanes render each state as filled blocks in its own lane — for **nominal** states where vertical order would lie.
**Variants (4):** `style="lanes"` → nominal states (deploy env, machine mode) without implying rank · `emphasis` → one-state decision read · `connectors={false}` → dense multi-row tables · explicit `states` order → ordinal severity ladders.
**Geometry (`geometry.ts`):** `hypnogramGeometry(opts: { data: { t: number; state: string }[]; states: string[]; domain: [number, number]; width: number; height: number; style: "steps" | "lanes" }): { runs: { x0: number; x1: number; y: number; row: number; state: string }[]; path: string }` — 2-dp; consecutive same-state entries merged.
**New core needs:** none.
**Interactive entry:** pointer x → run lookup (binary search on run edges); announce `"{state}, from {t0} to {t1}"`; ArrowLeft/Right roves runs, Home/End first/last. Focus ring = overlay rect on the current run.
**Summary (`hypnogramSummary`):** `"{transitions} transitions across {states} states; longest run {state}."` Example: **"14 transitions across 4 states; longest run Light."**
**Edge cases beyond the shared matrix:** single entry → one full-width run, 0 transitions; unknown state (not in `states`) → appended as a new bottom row + dev warning; out-of-order `t` → sorted (documented); zero-duration runs merged away.
**Size budget:** static ≤ 2 kB / interactive ≤ 3 kB.
**Honesty notes:** the whole point is the anti-interpolation rule (plan/17 F8) — a state is a fact, not a sample of a continuum. Any smoothing/easing of the step corners in animation is a bug; entrance animation is opacity only.
**Docs page:** Playground: state count, order, style, emphasis · 4-context: sleep sentence, deploy-state table cell, incident-severity KPI card, machine-state tab · why-default: steps + explicit order = the clinically proven read.

### 3. EtaBar — `eta-bar`
**Collection:** frontier · **Data shape:** S4 (`progress: number` 0–1, `elapsed: number`, `rate?: number`) · **Source:** plan/17 F14
**Question it answers:** how long is this actually going to take, given how it has actually been going?
**Primary encoding:** length (time axis — elapsed vs predicted-remaining) · **Precision:** high (elapsed), medium (forecast — and it says so)
**Default render:** viewBox `0 0 80 8`. The x-axis is **time, not fraction**: solid bar = elapsed share of predicted total, muted/hatched remainder = predicted remaining (`(1 − progress) / rate`), hairline divider at now. ETA label anchored at end (`text-anchor="end"`, tabular). Nodes ≤ 4. When rate is unknown or ≤ 0, remainder renders as an indeterminate texture (pattern fill, plan/17 system rule 1) and the label says "stalled" via `SummaryStrings` — never a fake countdown.
**Props beyond shared grammar:**
- `progress: number` · required · completed fraction 0–1.
- `elapsed: number` · required · time spent, any consistent unit.
- `rate?: number` · `progress / elapsed` · progress-per-time-unit; **pass a recent-window rate for the honest forecast** (whole-run average is the documented weaker default).
- `label?: "eta" | "percent" | "none"` · `"eta"` · the remaining-time read is the product; percent for progress-audit contexts.
- `formatEta?: (t: number) => string` · via `format` · unit-bearing label ("2 min") stays caller-owned; charts never invent units.
**Variants (3):** `label="percent"` → classic progress read on the honest geometry · auto-indeterminate (rate ≤ 0/absent — data-driven) → stalled transfers without lying · `<Marker celebrate>` child at completion → the done moment (annotation composition, plan/21 §2).
**Geometry (`geometry.ts`):** `etaBarGeometry(opts: { progress: number; elapsed: number; rate: number | null; width: number; height: number }): { done: Rect; remaining: Rect | null; indeterminate: boolean; remainingTime: number | null; predictedTotal: number | null }` — 2-dp.
**New core needs:** none.
**Interactive entry:** `live` mode — on prop change, remainder width transitions (CSS transform, reduced-motion → snap) and a polite live region re-announces at most every 10 s (throttle documented). No pointer model beyond focus readout. Composes the static entry.
**Summary (`etaBarSummary`):** `"{percent} done; about {remaining} remaining at the current rate."` (stalled: `"{percent} done; stalled."`). Example: **"64% done; about 2 min remaining at the current rate."**
**Edge cases beyond the shared matrix:** progress = 0 with elapsed > 0 → all-remainder, rate 0 → stalled; progress ≥ 1 → full bar, remainder null, summary "Done."; rate so low that remainder ≫ elapsed → remainder clamps to 90% of track + overflow chevron (documented: "over {t}").
**Size budget:** static ≤ 1.5 kB / interactive ≤ 2.5 kB.
**Honesty notes:** the remainder is sized by **observed rate, never linear interpolation** (plan/17 F14). When the rate drops, the remainder visibly grows — that is the feature; never animate the bar ahead of received data; never ease the divider forward between updates.
**Docs page:** Playground: progress/elapsed/rate sliders (watch the remainder resize), label mode, stall toggle · 4-context: download sentence, job-queue cell, deploy KPI card, export tab · why-default: eta label because "how long" is the question progress bars pretend to answer.

### 4. Waveform — `waveform`
**Collection:** frontier · **Data shape:** S1 (`number[]` amplitude samples, may be very long; negative values allowed) · **Source:** plan/17 F9
**Question it answers:** what is the shape of a high-frequency signal — where are its spikes and silences — at word width?
**Primary encoding:** length (mirrored bar height = per-bucket max amplitude) · **Precision:** medium
**Default render:** viewBox `0 0 120 24`. Mirrored amplitude bars around a center hairline. Downsampling via `core/downsample.ts`: **max-per-bucket (absolute max), NEVER mean** — spikes must survive compression. All bars render as **one** `<path>` of rect subpaths (1 node) + center line → 2–3 nodes regardless of sample count. Bucket count = `min(floor(width / 2), samples)`, documented cap 64. `crispEdges`.
**Props beyond shared grammar:**
- `progress?: number` · none · 0–1 played-fraction; buckets left of it tint accent, rest muted — position-in-media read.
- `style?: "bars" | "envelope"` · `"bars"` · envelope renders the min/max envelope as one filled area path — smoother editorial texture, same downsample rule.
- `mirror?: boolean` · `true` · single-sided (`false`) for strictly non-negative magnitude series.
**Variants (4):** `progress` → playback/scan position · `style="envelope"` → editorial texture at very small sizes · `mirror={false}` → magnitude-only signals · `SparkGroup` shared `domain` → honest loudness comparison across rows.
**Geometry (`geometry.ts`):** `waveformGeometry(opts: { data: number[]; width: number; height: number; buckets: number; domain: [number, number] | null; mirror: boolean }): { bars: { x: number; y: number; width: number; height: number }[]; path: string; peak: number; peakIndex: number }` — consumes `downsample.maxPerBucket` + `downsample.envelope`; 2-dp.
**New core needs:** `downsample.maxPerBucket`, `downsample.envelope` (Batch 0).
**Interactive entry:** pointer x → bucket lookup; hover shows bucket peak label + crosshair; announce `"{pct}% through, peak {value}"`; ArrowLeft/Right roves buckets; optional `onPointFocus` for scrub-to-seek recipes. Composes the static entry.
**Summary (`waveformSummary`):** `"Peak {peak} at {pct}% through {n} samples."` Example: **"Peak 0.82 at 63% through 4,096 samples."**
**Edge cases beyond the shared matrix:** all-silence (zeros) → flat center line + summary "Silent."; fewer samples than buckets → 1 bar per sample, no upsampling; DC offset (all-positive around a mean) renders honestly against the symmetric domain (no auto-centering — documented).
**Size budget:** static ≤ 2 kB / interactive ≤ 3 kB.
**Honesty notes:** two rules from plan/17 F9, both CI-tested: (1) **max-per-bucket, never mean** — a property test asserts every bucket bar ≥ the true max within it; (2) **peak-normalize honestly** — the auto domain is ±max|data| for shape reading and the peak is disclosed in the summary; quiet data must never be silently rescaled to look loud — absolute comparisons require an explicit shared `domain` (e.g. `[-1, 1]` full scale), and the docs page shows the wrong-vs-right pair.
**Docs page:** Playground: sample count, spike injector (prove spikes survive), style, mirror, progress · 4-context: voice-memo sentence, log-volume cell, audio KPI card, recording tab · why-default: bars + max-per-bucket = the only compression that can't hide an incident.

### 5. EventRaster — `event-raster`
**Collection:** frontier · **Data shape:** structured (`{ label: string; events: number[] }[]` — one lane per source, event timestamps) · **Source:** plan/17 F18
**Question it answers:** when did each source fire — and do sources fire together, in sequence, or not at all?
**Primary encoding:** position (x = time, y = lane) · **Precision:** high (occurrence), medium (exact time)
**Default render:** viewBox `0 0 120 (lanes × 8)`. One row per lane; one 1-unit-wide tick per event, rendered as **one `<path>` per lane** (tick subpaths) → n-lane nodes; lane cap 12 documented (per-cell budget, plan/21 §1). Optional lane labels in a left `ch` gutter (plan/18: anchor-placed, drop-out below width threshold). Shared `domain` across lanes (default: min/max over all events). `crispEdges`.
**Props beyond shared grammar:**
- `emphasis?: string` · none · accents one lane, mutes the rest — "did *api* fire when *db* did?".
- `labels?: boolean` · `true` when ≤ 8 lanes · left gutter lane names.
- `overflow?: "bin" | "clip"` · `"bin"` · when events per lane exceed ~width, ticks alias; `"bin"` switches that lane to per-bucket counts rendered as opacity (documented encoding change, flagged in the summary).
**Variants (3):** `emphasis` → synchronization read against one source · `labels={false}` → dense sentence/cell embedding · `overflow="bin"` → honest high-rate lanes instead of solid smears.
**Geometry (`geometry.ts`):** `eventRasterGeometry(opts: { data: { label: string; events: number[] }[]; domain: [number, number]; width: number; height: number; gutter: number }): { lanes: { label: string; y: number; path: string; count: number; binned: boolean }[] }` — 2-dp; uses `core/bin.ts` only in overflow mode.
**New core needs:** `bin.uniform` (Batch 0).
**Interactive entry:** pointer → lane from y, nearest event from x (binary search); announce `"{lane}, event at {t} ({k} of {n})"`; ArrowUp/Down lanes, ArrowLeft/Right events within lane (2-D keyboard, ActivityGrid pattern). Crosshair overlay via children.
**Summary (`eventRasterSummary`):** `"{lanes} lanes, {events} events; busiest {lane} ({count})."` Example: **"6 lanes, 214 events; busiest api (89)."**
**Edge cases beyond the shared matrix:** empty lane → label + empty row kept (silence is signal — never dropped); single lane → still a raster, docs steer to `rug-strip` for the one-lane case; identical timestamps across lanes → ticks align exactly (the sync read).
**Size budget:** static ≤ 2 kB / interactive ≤ 3 kB.
**Honesty notes:** one tick = one event, always; binned overflow mode changes the encoding and must say so (summary appends "; {lane} shown binned"). No jitter, no tick widening for "visibility".
**Docs page:** Playground: lanes, rate per lane, sync-burst injector, emphasis, overflow · 4-context: cron sentence, service-events cell, agent-steps KPI card, sensor tab · why-default: aligned lanes because vertical banding is the phenomenon.

### 6. RubricStrip — `rubric-strip`
**Collection:** frontier · **Data shape:** structured (`{ label: string; score: number; weight?: number }[]`, scores in `domain`, weights default equal) · **Source:** plan/17 F13
**Question it answers:** how did this thing score per criterion — with each criterion's importance visible — without a fake composite number?
**Primary encoding:** length (bar length = score) + width (bar thickness ∝ weight) · **Precision:** high (score), medium (weight)
**Default render:** viewBox `0 0 80 (rows-derived, ≤ 32)`. Stacked horizontal mini-bars: each bar's **thickness = its weight share** of total height (`core/stack.ts`), **length = score** on the shared `domain` (default `[0, 1]`, zero-anchored). Full-length track hairlines behind each bar. Optional label gutter (`ch`, plan/18). Nodes: 1 track path + 1 bar per criterion + labels; criterion cap 8 documented. **No composite/total bar exists and none may be added** — the type structurally resists collapsing quality into one number (plan/17 F13).
**Props beyond shared grammar:**
- `data` · required · as above.
- `target?: number` · none · pass-threshold tick drawn across all rows at the same score — one honest line instead of a total.
- `labels?: boolean` · `true` · criterion names in the left gutter; off for cell embedding.
**Variants (3):** `target` → pass/fail read per criterion · `labels={false}` → table-cell strip · equal weights (weights omitted) → unweighted checklists without visual noise (uniform thickness).
**Geometry (`geometry.ts`):** `rubricStripGeometry(opts: { data: { label: string; score: number; weight: number }[]; domain: [number, number]; width: number; height: number; gutter: number; gap: number }): { rows: { label: string; y: number; height: number; barWidth: number; trackWidth: number }[]; targetX: number | null }` — 2-dp.
**New core needs:** `stack.normalizedShares` (Batch 0).
**Interactive entry:** pointer y → row; announce `"{label}: {score}, weight {pct} of total"`; ArrowUp/Down roves criteria. Focus ring overlay.
**Summary (`rubricStripSummary`):** `"{n} criteria; highest {label} ({score}), lowest {label2} ({score2})."` Example: **"4 criteria; highest Correctness (0.92), lowest Style (0.41)."**
**Edge cases beyond the shared matrix:** one criterion → single full-height bar (docs steer to `bullet`); zero total weight → equal split + dev warning; score outside domain → clamped + dev warning.
**Size budget:** static ≤ 2 kB / interactive ≤ 3 kB.
**Honesty notes:** never render, compute, or announce a weighted total — the summary names extremes, not an average. Thickness must map to weight share linearly (no minimum-thickness floor beyond 2 viewBox units, documented).
**Docs page:** Playground: criteria editor, weights, target, labels · 4-context: eval sentence, model-comparison cell, code-review KPI card, vendor tab · why-default: weight-as-thickness keeps "importance" visible where a table hides it.

### 7. TokenConfidence — `token-confidence`
**Collection:** frontier · **Data shape:** structured (`{ token: string; confidence: number }[]`, confidence 0–1) · **Source:** plan/17 F12
**Question it answers:** which parts of this generated text should I double-check?
**Primary encoding:** typographic underline tier (color + thickness + stroke style) · **Precision:** low by design — documented steer: for numeric confidence auditing use `calibration-strip`
**Default render:** **HTML, not SVG — the text is the chart.** This is the documented exception to the shared `Chart` SVG root: the static entry renders `<span className="mc-token-confidence" role="img" aria-label={composed}>` (or `aria-labelledby` with the `id` opt-in, same naming contract as plan/08 amended, composed via `shared/a11y.ts`) containing one `<span>` per token. Tokens map to **three discrete tiers, never a continuous gradient**: *confident* (≥ hi) = no mark (quiet default — earn every mark); *unsure* (lo–hi) = solid underline, warn tint, `text-decoration-thickness: 2px`; *guessing* (< lo) = dotted underline, neg tint, 3px. Tier = color **and** thickness **and** stroke style — never color-alone. Styles live in `styles.css` (`@layer microcharts.charts`), tinted by `--mc-*` tokens; no SVG nodes; DOM cap ~500 token spans documented (chunk longer text).
**Props beyond shared grammar:**
- `data` · required · tokens + confidences (e.g. `exp(logprob)`).
- `tiers?: [number, number]` · `[0.5, 0.8]` · the lo/hi thresholds — the **only** tuning; a gradient prop will never exist.
- `show?: "flagged" | "all"` · `"flagged"` · `"all"` adds a hairline under confident tokens for completeness in audit UIs.
- `legend?: boolean` · `false` · appends the 1-line inline key ("― unsure · ⋯ guessing") the admission bar allows; docs require it wherever tier meaning isn't established by context.
**Variants (3):** `show="all"` → audit completeness · `legend` → self-contained embedding · `tiers` → domain-calibrated thresholds (calibrated thresholds beat universal ones — documented).
**Geometry (`geometry.ts`):** `tokenTiers(opts: { data: { token: string; confidence: number }[]; tiers: [number, number] }): { token: string; tier: "confident" | "unsure" | "guessing" }[]` + `tokenTierCounts(...)` — pure, shared by both entries and the summary.
**New core needs:** none.
**Interactive entry:** roving `tabIndex` across flagged tokens; focus/hover announces `"{token}: {tier}, {confidence}"`; ArrowLeft/Right roves flagged tokens (skip confident), Home/End. Uses `useId`; composes the static markup.
**Summary (`tokenConfidenceSummary`):** `"{n} tokens: {c} confident, {u} unsure, {g} guessing."` Example: **"42 tokens: 33 confident, 6 unsure, 3 guessing."**
**Edge cases beyond the shared matrix:** whitespace/empty tokens pass through unmarked; confidence NaN → guessing tier + dev warning; all-confident → plain text, `role="img"` and summary still present (the absence of marks is the finding); RTL text — underlines are direction-agnostic, verify in browser tests.
**Size budget:** static ≤ 1.5 kB / interactive ≤ 2.5 kB (+ its `styles.css` share).
**Honesty notes:** discrete tiers, never a gradient — people calibrate categorically (plan/17 F12). **Audit item (do in this chart's PR):** the discrete-tier rule leans on a 2026 preprint cited cautiously in plan/17; add a plan/12 hedged entry (claim, source, revisit trigger: replication failure ⇒ re-evaluate tier defaults — the gradient fallback remains rejected regardless, on color-alone grounds).
**Docs page:** Playground: sample text, tier thresholds, show/legend toggles · 4-context: chat sentence (native habitat), transcript cell, answer KPI card, draft tab · why-default: no mark on confident tokens because reading must stay primary. Testing note: no containment test (text flows); substitute a wrap/overflow assertion + axe on the HTML host; visual baselines via the standard screenshot harness.

### 8. WindBarb — `wind-barb`
**Collection:** frontier · **Data shape:** structured (`{ direction: number; magnitude: number }` — one mark) · **Source:** plan/17 F3
**Question it answers:** which way is it flowing and roughly how hard — in one character?
**Primary encoding:** angle (direction) + quantized barb count (magnitude) · **Precision:** medium — quantization is the honesty, not a limitation
**Default render:** viewBox `0 0 24 24`. Shaft line from center toward `direction` (degrees, 0 = up/north, clockwise — documented convention), barbs on the shaft's trailing end per WMO quantization: pennant = 5×`step`, full barb = `step`, half barb = `step`/2; magnitude rounds to the nearest half-step (documented). Calm (magnitude < `step`/4) renders the conventional open circle. All strokes one `<path>` + pennant polygons → ≤ 3 nodes. `vector-effect: non-scaling-stroke`.
**Props beyond shared grammar:**
- `direction: number` · required · degrees, from-direction per met convention (documented; pass `direction + 180` for to-direction reads).
- `magnitude: number` · required · any unit.
- `step?: number` · `10` · full-barb quantum; sets the read-back key ("each barb = 10").
- `label?: boolean` · `false` · numeric magnitude beside the glyph (anchored, tabular).
**Variants (3):** `label` → exact value alongside the glanceable glyph · calm circle (data-driven) → honest near-zero state · `style="arrow"` → plain direction arrow + label when quantized magnitude is meaningless for the data (keeps direction honest without inventing barbs).
**Geometry (`geometry.ts`):** `windBarbGeometry(opts: { direction: number; magnitude: number; step: number; width: number; height: number }): { shaft: { x1: number; y1: number; x2: number; y2: number }; barbs: { x1: number; y1: number; x2: number; y2: number }[]; pennants: string[]; calm: boolean; counts: { pennant: number; full: number; half: number } }` — 2-dp; this module is **reused by station-glyph** (chart-local import, not core).
**New core needs:** none.
**Interactive entry:** skipped: a single static glyph has no meaningful pointer/keyboard interaction; the accessible name already carries the full reading. (Rows of barbs get interaction from the host table/list.)
**Summary (`windBarbSummary`):** `"{compass} ({deg}°), magnitude {value}."` — compass octant names via `SummaryStrings`. Example: **"Southwest (225°), magnitude 32."**
**Edge cases beyond the shared matrix:** magnitude 0 → calm circle; negative magnitude → dev warning + absolute value with direction flipped 180° (documented); direction ≥ 360 → normalized.
**Size budget:** static ≤ 1.5 kB / no interactive entry.
**Honesty notes:** magnitude is quantized by design — the docs state the rounding rule and the per-barb quantum next to every example; never render fractional barbs.
**Docs page:** Playground: direction dial, magnitude, step, label · 4-context: weather sentence, traffic-flow cell, migration KPI card, routing tab · why-default: quantized barbs read faster and more honestly than a scaled arrow.

### 9. StarSpoke — `star-spoke`
**Collection:** frontier · **Data shape:** S3 (`{ label: string; value: number }[]`, 3–8 items, cap 8 documented) · **Source:** plan/17 F11
**Question it answers:** what is this entity's profile across a few metrics — and which entity in a set is the odd one out?
**Primary encoding:** length (spoke length = value from center) · **Precision:** medium
**Default render:** viewBox `0 0 32 32`. Spokes radiate from center, first at 12 o'clock, clockwise, equal angular spacing; length = value on **one shared `domain`** (default `[0, 1]`; per-metric normalization is the caller's, documented). Faint full-length guide hairlines behind each spoke for read-back. **No contour polygon, ever** — the validated finding is that contour-free wins (plan/17 F11); a `polygon` prop will never exist. Spokes = 1 path, guides = 1 path, optional end dots = 1 path → ≤ 4 nodes.
**Props beyond shared grammar:**
- `data` · required · as above.
- `dots?: boolean` · `false` · endpoint dots sharpen the outlier read at larger sizes.
- `guides?: boolean` · `true` · hairline full-length spokes (the read-back scaffold).
- `compare?: number[]` · none · same-length baseline values as muted ghost spokes — profile vs baseline.
- `labels?: boolean` · `false` · spoke labels, anchor-placed at spoke tips (plan/18), drop out below 48-unit size — documented static limitation.
**Variants (4):** `dots` → outlier emphasis · `compare` → vs-baseline read · `labels` → self-contained at KPI-card size · `guides={false}` → minimal glyph in dense grids (small-multiple use assumes a shared key).
**Geometry (`geometry.ts`):** `starSpokeGeometry(opts: { values: number[]; domain: [number, number]; width: number; height: number }): { spokes: { x1: number; y1: number; x2: number; y2: number; angle: number }[]; guidePath: string; spokePath: string }` — chart-local trig (lines, not arcs — `core/arc` not needed); 2-dp.
**New core needs:** none.
**Interactive entry:** pointer → angular sector lookup (atan2 to nearest spoke); announce `"{label}: {value}"`; ArrowLeft/Right rotates focus through spokes. Focus = accent overlay spoke.
**Summary (`starSpokeSummary`):** `"{n} metrics; highest {label} ({value}), lowest {label2} ({value2})."` Example: **"5 metrics; highest Speed (0.9), lowest Cost (0.3)."**
**Edge cases beyond the shared matrix:** < 3 items → dev warning + docs steer to `paired-bars`/`mini-bar`; all-equal → regular star (a meaningful "balanced profile" read); value > domain max → clamped + dev warning.
**Size budget:** static ≤ 2 kB / interactive ≤ 3 kB.
**Honesty notes:** no contour polygon (enclosed area lies about magnitude and axis order); one shared domain per glyph and per `SparkGroup` — mixed-domain spokes in one glyph are the caller's normalization, and the docs show how to state it.
**Docs page:** Playground: metric count, values, dots/guides/compare/labels · 4-context: product-profile sentence, entity-comparison table (small multiples — hero use), skill KPI card, plan tab · why-default: contour-free because the polygon is decoration that changes the read.

### 10. MinimapStrip — `minimap-strip`
**Collection:** frontier · **Data shape:** structured (`{ content: number[]; window: [number, number]; marks?: number[]; known?: [number, number][] }` — density series, viewport in domain units, annotation ticks, covered regions) · **Source:** plan/17 F10
**Question it answers:** where am I in the whole — and where in the whole is everything else I care about?
**Primary encoding:** position (window + marks along the extent) · **Precision:** high (position), low (content texture)
**Default render:** viewBox `0 0 120 16`. Z-order: fog texture over regions **outside** `known` (diagonal hatch pattern — unknown ≠ zero, plan/17 F10; `known` defaults to the whole domain), content micro-bars from `content` (downsampled max-per-bucket, one path), annotation tick lane along the top edge (one path), viewport `window` as a stroked rect on top. Nodes ≤ 5.
**Props beyond shared grammar:**
- `data` · required · as above; `content` may be empty (position-only minimap).
- `style?: "bars" | "heat"` · `"bars"` · heat renders content as an opacity strip — calmer under text.
- `markLane?: boolean` · `true` · dedicated tick lane vs overlaying ticks on content.
**Variants (3):** `style="heat"` → quiet inline scrollbar-like read · position-only (`content: []`) → pure window+marks navigation strip · fog regions (`known` partial) → crawled/loaded/explored coverage read.
**Geometry (`geometry.ts`):** `minimapGeometry(opts: { content: number[]; window: [number, number]; marks: number[]; known: [number, number][]; domain: [number, number]; width: number; height: number }): { contentPath: string; markPath: string; windowRect: Rect; fogRects: Rect[]; unknownShare: number }` — uses `downsample.maxPerBucket`; 2-dp.
**New core needs:** `downsample.maxPerBucket` (Batch 0).
**Interactive entry:** pointer drag/click moves the window → `onWindowChange([start, end])` (controlled); ArrowLeft/Right nudges by 5% (Shift = 20%), announce `"Viewing {a}–{b} of {total}"`. The flagship direct-manipulation entry of this batch after tape-gauge.
**Summary (`minimapSummary`):** `"Viewing {pct}% of the whole ({a}–{b} of {total}); {marks} marks{unknownClause}."` Example: **"Viewing 12% of the whole (520–660 of 1,200); 3 marks; 8% unknown."**
**Edge cases beyond the shared matrix:** window covering everything → full-width rect (honest "you see it all"); window outside domain → clamped + dev warning; marks in unknown regions render on top of fog (a known fact about an unknown region is still a fact).
**Size budget:** static ≤ 2.5 kB / interactive ≤ 3.5 kB.
**Honesty notes:** fog-of-war is a first-class state — unknown regions get texture, never blank/zero rendering, and the unknown share is disclosed in the summary. The window rect maps linearly to the domain; no fisheye.
**Docs page:** Playground: content length, window drag, marks, known-coverage editor · 4-context: doc-position sentence, log-viewer cell, timeline KPI card, editor tab · why-default: bars + separate mark lane keep "where am I" and "where are the annotations" as two clean reads.

### 11. DualWindowMeter — `dual-window-meter`
**Collection:** frontier · **Data shape:** S1 + scalar (`data: number[]` raw series; `target: number`) · **Source:** plan/17 F4
**Question it answers:** is the level compliant against its target both right now and on average — momentary spikes vs sustained drift?
**Primary encoding:** position (two co-plotted levels vs a target line) · **Precision:** high
**Default render:** viewBox `0 0 100 24`. From one raw series, two rolling means are computed and co-plotted: **fast window thin stroke, slow window thick stroke**, target hairline across, last-value labels for both windows right-anchored (`ch` gutter, tabular, plan/18). The plotted values are rolling means — the window sizes are part of the chart's meaning and appear in the docs/label, never hidden. Nodes ≤ 6.
**Props beyond shared grammar:**
- `target: number` · required · the compliance line; the type is meaningless without it.
- `windows?: [number, number]` · `[3, 30]` (samples) · fast/slow integration windows; **stated, never silent** — the default is documented on every example.
- `band?: [number, number]` · none · compliance corridor instead of a single target (renders as a muted zone).
- `damping?: number` · `0.3` · **ballistics for the live entry only**: exponential smoothing (α) applied to the *displayed motion* of the endpoints between updates — a documented display parameter that never alters plotted values.
- `label?: "last" | "none"` · `"last"` · right-edge current readings.
**Variants (3):** `band` → corridor compliance (thermal/latency SLO) · `windows` tuning → domain-correct integration (documented pairs per use case) · `label="none"` → dense cell embedding.
**Geometry (`geometry.ts`):** `dualWindowGeometry(opts: { data: number[]; windows: [number, number]; target: number; band: [number, number] | null; domain: [number, number] | null; width: number; height: number; gutter: number }): { fastPath: string; slowPath: string; targetY: number; bandRect: Rect | null; fastLast: number; slowLast: number }` — rolling means chart-local; 2-dp.
**New core needs:** none.
**Interactive entry:** `live` mode — endpoints and traces update with `damping` easing (WAAPI transform/opacity; reduced-motion → snap); hover x → both window values at that point announced `"fast {f}, slow {s}, target {t}"`; ArrowLeft/Right roves points.
**Summary (`dualWindowSummary`):** `"Slow window {slow} vs target {target}; fast {fast}."` Example: **"Slow window −23.1 vs target −23.0; fast −20.4."**
**Edge cases beyond the shared matrix:** series shorter than slow window → slow trace starts where the window fills (leading gap, documented — never a partial-window fake); fast ≥ slow window sizes → dev warning + swap; target outside data range → domain expands to include it.
**Size budget:** static ≤ 2.5 kB / interactive ≤ 3.5 kB.
**Honesty notes:** damping/ballistics is an exposed, documented display parameter (plan/17 F4) and affects motion only; window sizes are part of the reading and must be visible in docs and available to the summary; the two traces share one domain always.
**Docs page:** Playground: noise level, windows, target/band, damping (live demo shows ballistics) · 4-context: loudness sentence, latency-SLO cell, CPU-headroom KPI card, stream tab · why-default: thin-fast/thick-slow because the sustained read should carry more ink.

### 12. DepthWedge — `depth-wedge`
**Collection:** frontier · **Data shape:** structured (`{ demand: { level: number; amount: number }[]; supply: { level: number; amount: number }[] }`) · **Source:** plan/17 F5
**Question it answers:** how much pressure is stacked on each side of the current price/level, and how wide is the gap between them?
**Primary encoding:** area (cumulative step-wedges) · **Precision:** medium
**Default render:** viewBox `0 0 100 24`. Two filled cumulative step-areas meeting at the spread: demand accumulates leftward from the gap, supply rightward; mid hairline in the gap; optional spread label anchored above the gap. **y-scale is linear, full stop** — a `scale` prop is deliberately not offered; log-depth reading belongs to full-size tools (documented steer). x = level, clipped to `range` around the mid. 1 path per side + hairline + label → ≤ 4 nodes.
**Props beyond shared grammar:**
- `data` · required · both sides ordered by level (geometry sorts + accumulates outward from the gap).
- `range?: number` · data extent · ± level distance from mid to include; **the wedge shape depends on it, so it is stated** in docs and available to the summary ("within the shown range").
- `label?: "spread" | "none"` · `"spread"` · the gap is the headline number.
- `normalize?: boolean` · `false` · plot cumulative **shares** per side instead of absolute amounts — relative posture when absolute depth units differ across rows.
**Variants (3):** `normalize` → cross-row posture comparison · `range` tuning → near-book vs deep-book read · `label="none"` → cell embedding.
**Geometry (`geometry.ts`):** `depthWedgeGeometry(opts: { demand: Level[]; supply: Level[]; range: number | null; normalize: boolean; width: number; height: number }): { demandPath: string; supplyPath: string; midX: number; spread: number; ratio: number }` — cumulative sums chart-local; 2-dp.
**New core needs:** none.
**Interactive entry:** pointer x → cumulative depth at that level on the hovered side; announce `"{side}: {cum} within {dist} of mid"`; ArrowLeft/Right walks levels outward from mid. Crosshair overlay.
**Summary (`depthWedgeSummary`):** `"Demand outweighs supply {ratio}× within the shown range; spread {spread}."` (inverts wording when supply leads). Example: **"Demand outweighs supply 1.8× within the shown range; spread 0.25."**
**Edge cases beyond the shared matrix:** one side empty → single wedge + summary "no supply shown"; crossed levels (demand ≥ supply prices) → gap of zero, spread 0 rendered honestly; unsorted input → sorted.
**Size budget:** static ≤ 2 kB / interactive ≤ 3 kB.
**Honesty notes:** axis/scale choices are **stated, never silently log** (plan/17 F5) — v1 resolves this by shipping linear-only and saying so; the visible `range` is part of the claim, so the summary always carries "within the shown range".
**Docs page:** Playground: book generator, range, normalize, spread label · 4-context: market sentence, pair cell, liquidity KPI card, asset tab · why-default: linear + stated range because a wedge you can't interrogate must not editorialize.

### 13. PartitionStrip — `partition-strip`
**Collection:** frontier · **Data shape:** structured (`{ label: string; value?: number; children?: { label: string; value: number }[] }[]` — **two levels, hard limit**) · **Source:** plan/17 F20
**Question it answers:** what is the whole made of — and what are the big parts made of — with parentage visible?
**Primary encoding:** length (width = share of whole) + alignment (children under parents) · **Precision:** high (level 1), medium (level 2)
**Default render:** viewBox `0 0 120 24`. Two rows: parents on top (widths = share via `core/stack.ts`; parent value = own `value` or children sum — mismatch is a dev warning and children win), children aligned exactly under their parents below. 1-unit hairline gaps. Parent labels anchor-placed inside segments when the segment ≥ label length in `ch` (plan/18 drop-out); child labels are interactive-entry-only (documented static limitation). Depth > 2 in the input: **grandchildren are ignored with a dev warning** — the two-level limit is the honesty feature, not a v1 shortcut. Nodes: 1 rect per segment, cap 24 segments documented.
**Props beyond shared grammar:**
- `data` · required · as above.
- `emphasis?: string` · none · accents one node and its lineage (parent + siblings muted) — the "where does *react* sit" read.
- `labels?: boolean` · `true` · parent-row labels with size drop-out.
**Variants (3):** `emphasis` → lineage read · `labels={false}` → strip-only cell use · single-level data (no children) → degrades to a clean one-row strip (docs steer to `segmented-bar` if hierarchy never appears).
**Geometry (`geometry.ts`):** `partitionStripGeometry(opts: { data: PartitionNode[]; width: number; height: number; gap: number }): { segments: { label: string; row: 0 | 1; x: number; width: number; share: number; parentShare: number | null; parent: string | null }[] }` — uses `stack.normalizedShares` per row; 2-dp.
**New core needs:** `stack.normalizedShares` (Batch 0).
**Interactive entry:** pointer → segment (row from y, x range lookup); announce `"{label}: {pct}% of the whole{parentClause}"` (child clause: ", {pct2}% of {parent}"); ArrowLeft/Right within row, ArrowUp/Down between parent and first child (2-D keyboard, ActivityGrid pattern).
**Summary (`partitionStripSummary`):** `"{groups} groups, {parts} parts; largest {parent} → {child} ({pct}% of the whole)."` Example: **"3 groups, 8 parts; largest JS → react (28% of the whole)."**
**Edge cases beyond the shared matrix:** zero-value nodes dropped (documented); one parent = 100% → full-width top row (the children row is the read); child sums exceeding parent `value` → children win + dev warning.
**Size budget:** static ≤ 2 kB / interactive ≤ 3 kB.
**Honesty notes:** two levels max — deeper hierarchies at this size become unreadable texture, which is why treemaps fail the admission bar; alignment is exact (children x-ranges tile their parent's x-range to the 2-dp grid).
**Docs page:** Playground: tree editor, emphasis, labels · 4-context: bundle sentence, storage cell, budget KPI card, composition tab · why-default: two aligned rows beat a treemap because alignment is the comparison channel.

### 14. CalibrationStrip — `calibration-strip`
**Collection:** frontier · **Data shape:** structured (raw `{ p: number; outcome: 0 | 1 }[]`, binned internally; or pre-binned `{ predicted: number; observed: number; count: number }[]`) · **Source:** plan/17 F19
**Question it answers:** when this model says 70%, does it happen 70% of the time — and where is there enough data to even ask?
**Primary encoding:** position (observed frequency vs the identity diagonal per predicted bin) · **Precision:** medium
**Default render:** viewBox `0 0 100 32`. x = predicted probability (0–1), identity diagonal as a muted hairline, one dot per bin at (bin midpoint, observed frequency), and a **quiet support lane** along the bottom: per-bin count mini-bars (the honesty feature — always on). Bins with support below `minSupport` render as **open (hollow) dots at reduced opacity** — tiny bins must not look authoritative. Raw input is binned via `core/bin.ts` (10 uniform bins default). Nodes: diagonal + dot path + support path ≤ 4.
**Props beyond shared grammar:**
- `data` · required · raw pairs or pre-binned (discriminated by shape).
- `bins?: number` · `10` · uniform bin count for raw input.
- `minSupport?: number` · `max(10, 2% of total)` · below this, a bin renders as low-confidence (open + faded); documented formula.
- `style?: "dots" | "bars"` · `"dots"` · bars draw signed deviation columns from the diagonal — the miscalibration-magnitude read.
**Variants (3):** `style="bars"` → over/under-confidence magnitude per bin · `bins` tuning → resolution vs support trade-off (documented guidance) · pre-binned input → server-computed reliability data without shipping raw outcomes.
**Geometry (`geometry.ts`):** `calibrationGeometry(opts: { data: RawPair[] | BinnedRow[]; bins: number; minSupport: number; width: number; height: number; supportHeight: number }): { points: { x: number; y: number; predicted: number; observed: number; count: number; lowSupport: boolean }[]; diagonal: { x1: number; y1: number; x2: number; y2: number }; supportBars: Rect[]; maxGap: { predicted: number; observed: number } | null }` — uses `bin.uniform`; 2-dp.
**New core needs:** `bin.uniform` (Batch 0).
**Interactive entry:** pointer x → bin; announce `"predicted {p}, observed {o}, {n} samples{lowClause}"` (low-support clause: ", low support"); ArrowLeft/Right roves bins.
**Summary (`calibrationSummary`):** `"{bins} bins; largest gap at {p} predicted (observed {o}); {low} low-support bins."` Example: **"10 bins; largest gap at 0.7 predicted (observed 0.52); 2 low-support bins."**
**Edge cases beyond the shared matrix:** empty bins → skipped (no dot, no support bar — absence visible as a gap); all predictions in one bin → one authoritative dot + 9 gaps (an honest "this model only ever says 0.9"); outcomes not in {0,1} → invalid per shared matrix.
**Size budget:** static ≤ 2.5 kB / interactive ≤ 3.5 kB.
**Honesty notes:** the support lane is not optional and low-support styling is not disableable — a reliability read without support disclosure is the exact failure mode this chart exists to prevent (plan/17 F19). No single-number calibration score (ECE) is rendered or announced.
**Docs page:** Playground: model-quality generator (calibrated/over/under), bins, minSupport, style · 4-context: model sentence, eval-table cell, trust KPI card, model-version tab · why-default: dots + always-on support because "how sure" and "based on how much" must travel together.

### 15. FoldedDayBand — `folded-day-band`
**Collection:** frontier · **Data shape:** structured (`{ t: number; value: number }[]` — raw observations across many periods; `t` in period units, folded by `t mod period`) · **Source:** plan/17 F7
**Question it answers:** what does a typical period look like — and is the current one typical?
**Primary encoding:** position (median line) + area (percentile envelopes) · **Precision:** medium
**Default render:** viewBox `0 0 120 32`. x = position within the fold period (default 24), binned; per-bin quantiles via `core/quantile.ts`: 5–95 envelope (faintest, soft/fading edges per the plan/17 absorbed refinement — hard band edges overclaim), 25–75 envelope, median line on top; optional `today` overlay as an accent line. Nodes ≤ 5 (2 band paths + 2 lines + today).
**Props beyond shared grammar:**
- `period?: number` · `24` · fold length in `t` units (168 folds a week; any cycle).
- `today?: { t: number; value: number }[]` · none · the current period overlaid — the "how typical is now" read.
- `bands?: [number, number][]` · `[[25, 75], [5, 95]]` · percentile pairs, outermost last; ≤ 2 pairs documented.
- `bins?: number` · `24` · fold-axis resolution.
**Variants (3):** `today` overlay → now-vs-typical (the hero use) · `period` → weekly/seasonal folds · single band (`bands=[[25,75]]`) → calmer inline texture.
**Geometry (`geometry.ts`):** `foldedBandGeometry(opts: { data: TP[]; today: TP[] | null; period: number; bins: number; bands: [number, number][]; width: number; height: number }): { bandPaths: string[]; medianPath: string; todayPath: string | null; peak: { bin: number; median: number }; todayPercentile: number | null }` — uses `quantile.quantiles`; 2-dp.
**New core needs:** `quantile.quantiles` (Batch 0).
**Interactive entry:** pointer x → bin; announce `"at {pos}: median {m}, middle half {q1}–{q3}{todayClause}"`; ArrowLeft/Right roves bins.
**Summary (`foldedBandSummary`):** `"Median peaks at {pos} ({value}){todayClause}."` (today clause: `"; today is above the 75th percentile"` / below 25th / typical). Example: **"Median peaks at hour 14 (82); today is above the 75th percentile."**
**Edge cases beyond the shared matrix:** < 2 observations in a bin → band collapses to the median at that bin (documented — never extrapolated width); < 2 full periods of data → dev warning ("envelope from {n} periods") + summary discloses; uneven sampling per bin is fine (quantiles are per-bin).
**Size budget:** static ≤ 2.5 kB / interactive ≤ 3.5 kB.
**Honesty notes:** envelopes come from real per-bin quantiles, never smoothed across bins into shapes the data doesn't support; band edges fade (soft edge) so the 5–95 boundary doesn't read as a hard limit; the number of folded periods backs the claim and is disclosed when thin.
**Docs page:** Playground: periods of data, noise, period length, bands, today toggle · 4-context: traffic sentence, on-call cell, energy KPI card, capacity tab · why-default: two envelopes + median is the clinically proven typical-day grammar.

### 16. VolumeProfile — `volume-profile`
**Collection:** frontier · **Data shape:** structured (`{ level: number; weight: number }[]` — activity mass at each level; or raw `levels: number[]`, counted) · **Source:** plan/17 F15
**Question it answers:** at which *level* did activity concentrate — not when?
**Primary encoding:** length (horizontal bar = mass at level; the level axis runs vertically) · **Precision:** medium
**Default render:** viewBox `0 0 48 32`. A histogram turned **perpendicular to the usual trend axis**: y = level (binned via `core/bin.ts`, ≤ 12 bins), bars extend horizontally from the level axis; the modal bin (**POC**) gets the accent; the **value area** (smallest contiguous span of bins holding `valueArea` of total mass around the POC) gets a muted background band; other bars are neutral. Bars = 1 path + value-area rect + POC accent bar ≤ 4 nodes.
**Props beyond shared grammar:**
- `data` · required · level/weight rows or raw levels.
- `valueArea?: number` · `0.7` · mass fraction defining the shaded span; documented convention.
- `side?: "left" | "right"` · `"left"` · which way bars grow — pairs visually with a trend chart on the opposite side.
- `label?: "poc" | "none"` · `"poc"` · the POC level, anchored beside the accent bar (tabular).
**Variants (3):** `side` → left/right pairing with an adjacent trend · `valueArea` tuning → tighter/looser concentration claim · raw-levels input → count-based profiles (event levels, price ticks) without pre-aggregation.
**Geometry (`geometry.ts`):** `volumeProfileGeometry(opts: { data: LevelRow[]; bins: number; valueArea: number; side: "left" | "right"; width: number; height: number; gutter: number }): { bars: { y: number; height: number; width: number; level: number; poc: boolean }[]; valueAreaRect: Rect; poc: { level: number; share: number } }` — uses `bin.uniform`; 2-dp.
**New core needs:** `bin.uniform` (Batch 0).
**Interactive entry:** pointer y → bin; announce `"level {l}: {pct}% of activity{pocClause}"`; ArrowUp/Down roves bins.
**Summary (`volumeProfileSummary`):** `"Activity concentrates at {poc} (POC); {va}% within {lo}–{hi}."` Example: **"Activity concentrates at 142 (POC); 70% within 138–147."**
**Edge cases beyond the shared matrix:** uniform mass → no meaningful POC; the first modal bin takes the accent and the summary says "evenly spread"; single level → one full bar; ties for POC → lowest level wins (documented, deterministic).
**Size budget:** static ≤ 2 kB / interactive ≤ 3 kB.
**Honesty notes:** value area is a stated convention (default 70%, visible in docs/summary), not an implied confidence interval. **Grammar-novelty integration risk, flagged:** this is the catalog's only chart whose primary axis is the *value* axis of a companion trend chart; `SparkGroup` shares same-axis domains only, so **cross-axis domain binding is out of scope for v1** — the chart ships standalone with a documented side-by-side pairing recipe (shared explicit `domain` passed to both), and cross-axis group support is a logged follow-up (see batch risks).
**Docs page:** Playground: distribution shape, bins, valueArea, side, paired-with-sparkline recipe · 4-context: price sentence, level-activity cell, load-by-tier KPI card, market tab · why-default: perpendicular histogram because "where" is a different question from "when", and no time-axis chart can answer it.

### 17. PhaseTrace — `phase-trace`
**Collection:** frontier · **Data shape:** structured (`{ x: number; y: number }[]` — two synchronized signals as one time-ordered trajectory) · **Source:** plan/17 F16
**Question it answers:** how do two coupled signals move *together* — loops (lag/feedback), clusters (regimes), and where the system is right now?
**Primary encoding:** position (x×y trajectory; path order = time) · **Precision:** medium — stated; the docs steer exact-value reading to `dual-sparkline`
**Default render:** viewBox `0 0 40 32`. Trajectory as two strokes: full path muted, last-`tail` fraction accented; directed endpoint = dot + small arrowhead along the final segment; optional start dot. **Axes and domains are named and stated:** `xLabel`/`yLabel` feed the summary (fallback "x"/"y" + dev warning when a `title` is present without labels); `xDomain`/`yDomain` default to data min/max and are **always linear — no log option exists** (out-of-range needs are the caller's transformation, stated in their label). Nodes ≤ 5.
**Props beyond shared grammar:**
- `xLabel?: string`, `yLabel?: string` · `"x"`/`"y"` · the axes must be nameable or the glyph is unreadable — summary depends on them.
- `xDomain?: [number, number]`, `yDomain?: [number, number]` · data min/max · stated framing; both linear.
- `tail?: number` · `0.25` · fraction of points drawn in accent — the "recent motion" read.
- `startDot?: boolean` · `false` · anchors the path's origin for full-journey reads.
- `grid?: boolean` · `false` · center hairlines splitting the plane into quadrants — regime labels live in the caller's copy.
**Variants (4):** `tail` → recency emphasis · `grid` → quadrant/regime read (CPU×latency) · `startDot` → journey read · shared explicit domains across a `SparkGroup` row → comparable trajectories.
**Geometry (`geometry.ts`):** `phaseTraceGeometry(opts: { data: XY[]; xDomain: [number, number]; yDomain: [number, number]; tail: number; width: number; height: number }): { trailPath: string; tailPath: string; end: { x: number; y: number }; arrow: string; start: { x: number; y: number }; heading: "up-right" | "up-left" | "down-right" | "down-left" | "steady" }` — heading from the mean of the last `tail` segment deltas; 2-dp.
**New core needs:** none.
**Interactive entry:** hover → nearest point **in time order** (index lookup on the precomputed array, not spatial nearest — crossings make spatial lookup lie); announce `"point {i} of {n}: {xLabel} {x}, {yLabel} {y}"`; ArrowLeft/Right steps time. Crosshair dot overlay.
**Summary (`phaseTraceSummary`):** `"{yLabel} vs {xLabel}: now {x}, {y}; heading {direction}."` — direction words via `SummaryStrings`. Example: **"Latency vs CPU: now 62, 130; heading up-right."**
**Edge cases beyond the shared matrix:** unequal-length source arrays → caller error (single `{x,y}[]` shape prevents it); coincident consecutive points collapse (path dedup); 2 points → a single directed segment (still honest).
**Size budget:** static ≤ 2 kB / interactive ≤ 3 kB.
**Honesty notes:** axis/scale choices **stated, never silently transformed** (plan/17 F16): named axes, linear domains, framing disclosed. Time direction must stay recoverable — the tail/endpoint/arrow trio may be restyled but never all removed.
**Docs page:** Playground: coupled-signal generator (lag slider → watch loops appear), tail, grid, labels · 4-context: system sentence, service cell, econ KPI card (inflation×unemployment), autoscaler tab · why-default: muted-trail + accent-tail because "now, and how it got here" is the question.

### 18. TraceFold — `trace-fold`
**Collection:** frontier · **Data shape:** structured (`{ label: string; start: number; duration: number; depth: number; parent?: number; critical?: boolean }[]` — flat span list; `parent` = index) · **Source:** plan/17 F17
**Question it answers:** where did the latency go — which spans, at which depth, on the path that actually determined the total?
**Primary encoding:** length (width = duration) + position (x = start, row = depth) · **Precision:** high
**Default render:** viewBox `0 0 120 (depth-derived, ≤ 40)`. One rect per span: x = start (wall-clock within the trace extent), width = duration, y = depth row. **Critical path accented**, other spans muted: when `parent` links exist, geometry computes the critical path (the chain of spans from the root whose durations bound the total — longest-duration child chosen at each level); explicit `critical` flags override; with neither, the root span alone is accented + dev note. Span labels render inside rects only when width ≥ label length in `ch` (plan/18 drop-out); full labels are interactive-entry territory. Nodes: 1 rect per span, cap 40 documented (per-cell budget). `crispEdges`.
**Props beyond shared grammar:**
- `data` · required · flat spans as above (an OTel-tree flattening snippet ships in docs, not in the library).
- `emphasis?: "critical" | "none"` · `"critical"` · muting non-critical spans is the decision read; `"none"` for uniform audits.
- `labels?: boolean` · `true` · width-gated in-rect labels.
**Variants (3):** `emphasis="none"` → structure-only audit · `labels={false}` → dense trace tables · explicit `critical` flags → precomputed critical paths from the backend.
**Geometry (`geometry.ts`):** `traceFoldGeometry(opts: { data: Span[]; width: number; height: number; rowGap: number }): { rects: { x: number; y: number; width: number; height: number; label: string; depth: number; critical: boolean; share: number }[]; total: number; criticalCount: number; longest: { label: string; duration: number; critical: boolean } }` — critical-path walk chart-local; 2-dp.
**New core needs:** none.
**Interactive entry:** pointer → span (row from y, x-range binary search within row); announce `"{label}, {duration}, {pct}% of total, depth {d}{criticalClause}"`; ArrowLeft/Right roves spans in start order, ArrowUp/Down moves depth (2-D keyboard). Hover = outline overlay + label reveal.
**Summary (`traceFoldSummary`):** `"{n} spans over {total}; longest {label} ({duration}) on the critical path."` (off-path longest: wording drops the clause and names the critical share instead). Example: **"9 spans over 214 ms; longest db.query (86 ms) on the critical path."**
**Edge cases beyond the shared matrix:** overlapping siblings at one depth → rendered as-is (concurrency is the read); span exceeding the trace extent → clamped + dev warning; depth gaps (0 → 2) → rows compacted (documented); zero-duration spans → 1-unit-minimum tick width, disclosed in docs as a floor.
**Size budget:** static ≤ 2.5 kB / interactive ≤ 3.5 kB.
**Honesty notes:** widths are durations on one linear shared time scale — no per-row normalization ever; the 1-unit zero-duration floor is the single documented width distortion; critical-path computation is deterministic and documented (ties → earliest start wins).
**Docs page:** Playground: trace generator (fan-out/sequential shapes), emphasis, labels · 4-context: request sentence, endpoint cell, p95-exemplar KPI card, deploy-diff tab · why-default: critical-path accent because "which spans mattered" is the question a uniform flame strip doesn't answer.

### 19. TapeGauge — `tape-gauge`
**Collection:** frontier · **Data shape:** S4 (`value: number`, `rate?: number`, + zone config) · **Source:** plan/17 F1
**Question it answers:** what is the level right now, which zone is it in, and how fast is it moving — with the eye parked in one place?
**Primary encoding:** position on a scrolling scale (**the value is fixed at the pointer; the scale moves**) + chevron tier (rate) · **Precision:** high (value readout), medium (rate)
**Default render:** viewBox `0 0 28 48` (vertical, aviation convention). A window onto the scale, `span` units tall, centered on `value`: zone band rects, tick marks (one path) at a "nice" step derived from `span`, 2–3 tick labels (anchored, tabular, plan/18), fixed center pointer (small triangle + value readout box at the pointer — the one number that never moves), and a rate chevron above/below the pointer: |rate| quantized against `rateTiers` to 0/1/2 chevrons, direction by sign — **rate is a separate channel from level**, per the source instrument. Ticks/labels are *generated only within the window* — containment by construction, no `clipPath`. Nodes ≤ 9 (documented max; above the ≤ 6 typical, per plan/21 §1 documented-max allowance).
**Props beyond shared grammar:**
- `value: number` · required · current level.
- `rate?: number` · none · signed units-per-update; drives the chevron tier and the live-entry scroll velocity.
- `zones?: { from: number; to: number; tone: "pos" | "neg" | "warn" | "neutral" }[]` · none · semantic bands on the scale; tone tokens only, never raw colors.
- `span?: number` · auto (from zones extent, else `20 × |rate|` floor, else 10% of |value|, documented) · visible scale extent; **fixed during live updates**.
- `rateTiers?: [number, number]` · `[span/60, span/15]` per update · thresholds for 1 and 2 chevrons (documented derivation).
- `orientation?: "vertical" | "horizontal"` · `"vertical"` · horizontal tape for row/cell embedding.
**Variants (4):** `orientation="horizontal"` → table-cell tape · `zones` → compliance-zone read (the airspeed use) · `label="none"` → pointer-only glyph next to an external number · rate-less (`rate` omitted) → static snapshot without chevrons.
**Geometry (`geometry.ts`):** `tapeGaugeGeometry(opts: { value: number; span: number; zones: Zone[]; tick: number | null; width: number; height: number; orientation: Orientation }): { zoneRects: Rect[]; tickPath: string; tickLabels: { text: string; x: number; y: number; anchor: string }[]; pointer: { path: string; labelX: number; labelY: number }; window: [number, number] }` + `chevronTier(rate: number, tiers: [number, number]): -2 | -1 | 0 | 1 | 2` — "nice" tick step chart-local; 2-dp.
**New core needs:** none.
**Interactive entry (flagship live entry):** `live` mode — when `value` changes, the tick/zone group **translates** (WAAPI `transform`, duration ∝ delta, capped 300 ms; reduced-motion → snap) while the pointer and readout stay fixed; the readout number updates at animation end; chevron tier updates immediately. Polite live region announces the summary, throttled to ≥ 5 s. Keyboard: focus reads the full summary; no pointer scrubbing (there is no series to scrub). Composes the static entry — the client owns only the transform and announcements.
**Summary (`tapeGaugeSummary`):** `"Now {value}{rateClause}{zoneClause}."` — rate clause from tier ("rising"/"rising fast"/"falling"…), zone clause names the containing zone. Example: **"Now 142, rising; in the 130–150 caution zone."**
**Edge cases beyond the shared matrix:** value outside all zones → no zone clause; zones overlapping → later wins + dev warning; span smaller than a tick step → single tick + readout (degenerate but honest); NaN value → per shared matrix.
**Size budget:** static ≤ 3 kB / interactive ≤ 4 kB (batch maximum — hard caps, plan/21 §1).
**Honesty notes:** the scale scrolls, the value doesn't — inverting this is a different (worse) chart. `span` is **fixed while live** — auto-rescaling the window during updates would manufacture drama (rule, tested); the chevron encodes rate, the position encodes level, and the two never blend.
**Docs page:** Playground: value slider (watch the tape scroll), rate, zones editor, span, orientation · 4-context: sentence ("cabin at <tape> ft"), metric cell, live KPI card (hero), autoscaler tab · why-default: fixed-eye reading is the entire point — NASA-studied instrument grammar, described in behavior terms only (non-negotiable #6).

### 20. StationGlyph — `station-glyph` (halo piece — build last)
**Collection:** frontier · **Data shape:** structured slot record (below) · **Source:** plan/17 F2
**Question it answers:** what is this entity's full multi-metric state, in one character-sized mark, across a grid of many entities?
**Primary encoding:** fixed geometric slots (position = metric identity; per-slot channels below) · **Precision:** medium — the grid/at-a-glance read is the product; docs steer per-metric precision to dedicated charts
**The slot grammar (the resolved open question — this API is fixed and documented):** up to **6 metrics** in fixed slots, plus one identity slot. Slot position IS metric identity — the same metric must occupy the same slot across every glyph in a set, and a **1-line key is a documented requirement** for any group (the admission bar's read-back condition).

| Slot | Prop | Channel | Encodes |
|---|---|---|---|
| center | `center: { value: number; domain?: [number, number] }` | vertical fill height of the outlined center disc | one bounded fraction (utilization, coverage, capacity) |
| stick (2 metrics) | `stick: { direction: number; magnitude?: number; step?: number }` | shaft angle + quantized WMO barbs (reuses `wind-barb` geometry, chart-local import) | direction + magnitude (flow, trend bearing) |
| corner NE | `corners.ne: SlotValue` | anchored tabular number (plan/18) | auxiliary value 1 |
| corner SE | `corners.se: SlotValue` | anchored tabular number | auxiliary value 2 |
| corner SW | `corners.sw: SlotValue` | anchored tabular number | auxiliary value 3 |
| NW (identity) | `label?: string` | anchored text | entity name/id — never a metric |

`SlotValue = { value: number; format?: Intl.NumberFormatOptions | ((n: number) => string); tone?: "pos" | "neg" | "neutral" }` — corner tones tint the numeral and prepend the sign (never color-alone). Only slots with data render (earn every mark); any subset is valid. **This vocabulary is glyph-local:** `center`/`stick`/`corners` must not leak onto other charts (plan/21 §3 rule 3 protects the shared grammar).
**Default render:** viewBox `0 0 24 24` nominal (scales via width/height). Z-order: center disc outline + fill rect (clip-free: fill rect height computed, disc drawn as two arcs via `core/arc.ts`), stick + barbs, corner numerals, NW label. Nodes ≤ 10 documented max (all six slots active).
**Props beyond shared grammar:** the slot props above, plus:
- `quantizeCenter?: number` · none · quantizes the center fill to n levels (e.g. 4 → quarter-steps) for pattern-legible print/e-ink grids.
**Variants (3):** slot subsets (data-driven; docs name canonical trios like center+stick, center+2 corners) → right-sized glyphs without config · `quantizeCenter` → glanceable stepped fill for print/e-ink · `label` identity slot → self-labeling grid cells.
**Key requirement:** the entry also exports `<StationGlyphKey slots={{ center: "Utilization", stick: "Traffic", ne: "p95", se: "Errors", sw: "Cost" }} />` — a one-line inline HTML key. Docs REQUIRE a key adjacent to any glyph group; the a11y summary names every active slot regardless, so single glyphs are self-describing to AT without it.
**Geometry (`geometry.ts`):** `stationGlyphGeometry(opts: { center: CenterSlot | null; stick: StickSlot | null; corners: Corners; size: number }): { disc: { outline: string; fill: Rect | null }; stick: WindBarbGeometry | null; cornerLabels: { text: string; x: number; y: number; anchor: string; tone: Tone | null }[]; labelPos: { x: number; y: number } }` — imports `windBarbGeometry` from `../wind-barb/geometry.js`; 2-dp.
**New core needs:** `arc.annulus`/`arc.sector` (Batch 0) for the disc outline.
**Interactive entry:** roving focus across active slots (Tab into glyph, ArrowLeft/Right cycles slots); each slot announces its key name + reading (`"Utilization: 60%"`, `"Traffic: southwest, 25"`); slot names come from a `slots` prop mirroring the key (falls back to slot ids + dev warning in grouped use). Hover highlights the slot mark.
**Summary (`stationGlyphSummary`):** composed clause per active slot, key names when provided: `"{Center} {pct}; {stick clause}; {corner clauses}."` Example: **"Utilization 60%; traffic from the southwest, 25; p95 180; errors 3."**
**Edge cases beyond the shared matrix:** no slots given → renders nothing + dev warning (an empty glyph is a bug, not a state); center value outside domain → clamped + dev warning; corner label overflow → corner numerals cap at 5 characters via the caller's `format` (documented; the containment test asserts the 0.62 · em/char estimate stays inside the viewBox).
**Size budget:** static ≤ 3 kB / interactive ≤ 4 kB.
**Honesty notes:** slots are positional identity — reordering metrics between glyphs in one set is the lie this grammar exists to prevent (docs state it as a hard usage rule); center fill is linear height, never area-of-disc (area reads nonlinearly); barbs stay WMO-quantized via the shared wind-barb rules.
**Docs page:** the halo page — Playground: slot toggles, live key, fleet-grid demo (20 glyphs + one key line) · 4-context: sentence, fleet-table cell (hero), node KPI card, region tab · why-default: fixed slots because a stable geometric alphabet is what makes 20 glyphs scannable in one fixation. Ship alongside the launch gallery refresh; this is the marketing centerpiece (plan/17 roadmap note).

---

---

### 21. ConfusionGrid — `confusion-grid` (ADDED 2026-07-08 · schedule after CalibrationStrip — same audience, shared review lens; before TapeGauge/StationGlyph)

**Collection:** frontier · **Data shape:** structured — `data: { labels: readonly string[]; counts: readonly (readonly number[])[] }` (k×k matrix, rows = actual, columns = predicted, k ∈ [2, 4]) · **Source:** plan/17 §F21 (added 2026-07-08; provenance plan/12 §catalog-expansion — Neo CHI 2022, ConfusionFlow lineage)
**Question it answers:** Where do the errors go? — the one thing accuracy-as-a-number hides.
**Primary encoding:** cell ink (row-normalized share) in a fixed k×k grid; diagonal = agreement, accented · **Precision:** medium (calibrated color per HeatCell's channel; exact shares via labels/interactive readout).
**Default render:** viewBox `40×40` (k=2; grows to `48×48` at k=4, integer cells). Z-order: (1) k² cell rects, ink opacity from row-normalized share on the `--mc-accent` ramp; (2) diagonal cells get a hairline inset stroke (`data-mc-ink="accent"`) — agreement is marked by SHAPE, never color-alone (forced-colors safe); (3) axis micro-labels: first-character class labels on top and left edges (anchor-only, ch gutters per plan/18; full labels live in the summary/interactive readout — at glyph scale one character + the 1-line key is the documented read-back path); (4) optional accuracy label right-gutter. Node budget: k² + k diagonal strokes + 2k labels ≤ 28 at k=4 (documented per-cell exception, plan/21 §1). Tokens: `--mc-accent` ramp, `--mc-muted` labels.
**Props beyond shared grammar:**
- `data: { labels; counts }` · required · labels length must equal counts rank; k > 4 rejected in dev (legibility bar — plan/17 F21 micro rule).
- `normalize?: "row" | "none"` · `"row"` · row-normalized answers "of the actual X, where did predictions go?" (the recall view — the standard read); `"none"` renders raw-count ink on a shared max for volume-honest comparison.
- `accent?: "diagonal" | "errors"` · `"diagonal"` · errors mode accents the LARGEST off-diagonal cell instead — "the worst confusion" for triage contexts.
- `label?: "accuracy" | "none"` · `"none"` · overall accuracy % in the gutter; off by default because the chart exists to resist that collapse (RubricStrip's principle) — opt-in only.
**Variants (2–6):** `normalize` (recall view ↔ volume view) · `accent` (agreement ↔ worst-confusion) · `label` · `shape="round"` cells (shared cell vocabulary, plan/21 §3).
**Geometry (`geometry.ts`):**
```ts
export function confusionGridGeometry(opts: {
  size: number; k: number;
  counts: readonly (readonly number[])[];
  normalize: "row" | "none"; gutterCh: number;
}): {
  cells: { x: number; y: number; w: number; share: number; diagonal: boolean }[]; // share 2-dp
  rowTotals: number[]; accuracy: number;        // trace/total, 2-dp
  maxErrorCell: { row: number; col: number } | null;
}
```
**New core needs:** none (`core/bin.ts` not needed — counts arrive binned by definition).
**Interactive entry:** pointer → cell by grid lookup; announces "Actual cat, predicted dog: 12% of cats." (row-share phrasing from `strings`); 2-D arrow roving (ActivityGrid keyboard model); Home/End jump the diagonal. Live region reuses row/column labels in full — the interactive entry IS the full-label read-back path.
**Summary (`confusionSummary`):** real example: **"Accuracy 87%. Most confused: cat predicted as dog (12% of cats)."** Perfect diagonal: **"Accuracy 100%. No confusion."**
**Edge cases beyond the shared matrix:** zero row (no actuals of a class) → cells render hollow, share null, summary notes "no dog samples" — never divide by zero into fake certainty · non-square or labels/rank mismatch → dev error · negative counts → treated 0 + dev-warned · k=1 rejected (not a comparison).
**Size budget:** static ≤ 2.4 kB / interactive ≤ 3.2 kB.
**Honesty notes:** row-normalization is stated in the docs AND the summary phrasing ("% of cats") so the denominator travels with every number · accuracy label off by default and never rendered without the grid (the number may not leave its context) · diagonal accent is shape-based; the ink ramp is the same for agreement and error cells — good and bad are positions, not colors, so `positive` polarity does not exist here (documented).
**Docs page:** Playground: data (2×2/3×3 presets), normalize, accent, label. 4-context: KPI card hero (eval dashboards). "Why this default": row view answers the question practitioners actually ask; the 1-line key ("rows actual, columns predicted") appears in every example.

## Part B — Release sync & pitch (the buildout's final gate)

Everything below runs **after** the Batch 4 chart gate (full DoD ×21, Argos approved, bench green)
and blocks launch. Substance lives in plan/20 — this is the execution checklist; don't restate its
prose, satisfy it.

### B.1 README rewrite (falsifiable-number pitch)
- [ ] Rewrite the pitch to the 96-chart shipped reality: one sentence + install + one example + rendered image on the first screen (plan/20 §10 README requirements).
- [ ] Every number falsifiable and regenerated: per-subpath gzip from size-limit output, "one chart ≈ 1–3 kB; all 96 ≈ N kB" with measured N (budget model v2, plan/21 §1 — the "≤ 10 kB library" claim is dead everywhere), SSR rows/ms from `bench/`, node counts from the unit gates. **No number in the README that a script didn't emit** (working rule: bench claims reproducible from `bench/`).
- [ ] Comparison table with receipts only: size (measured, per-subpath), deps (0 vs counted), a11y (summary-by-default with a real `describeSeries` string quoted), RSC (0 client-JS static entries) vs react-sparklines / Recharts / Tremor. Include "when the competitor is better" per plan/20 §2 — no strawmen.
- [ ] Badges: CI, npm version, gzip, zero-deps, license — no clutter (plan/20 §10).
- [ ] Import-path table + links to docs (UTM), `/llms.txt`, `/catalog.json`.

### B.2 npm metadata (plan/20 §10)
- [ ] `description`, `keywords`, `homepage` (docs domain + UTM), `repository` exactly per plan/20 §10 block; keywords extended with shipped-catalog terms (no keyword spam).
- [ ] `npm view @microcharts/react` shows homepage/repository/keywords/license/provenance; `publint` + `attw` green; `npm pack --dry-run` = README, license, dist, styles only.

### B.3 GitHub surface (plan/20 §10)
- [ ] Repo topics set: `react`, `charts`, `sparkline`, `svg`, `accessibility`, `dataviz`, `rsc`, `zero-dependency`, `typescript`.
- [ ] Social preview image = docs OG default (same artifact, not a lookalike).
- [ ] Discussions categories (Q&A / Show and tell / Chart requests) + issue templates requiring data shape + intended context.

### B.4 Docs-site final sync
- [ ] Gallery + `/catalog.json` complete: 96 entries from the registry, `catalog.test.ts` cross-validating every entry against `package.json#exports` (both directions — plan/20 §5.3 acceptance).
- [ ] Stats regenerated from size-limit output via `scripts/sync-sizes.mjs` — zero hand-keyed numbers (plan/21 §6.0.B); CI asserts generated == committed.
- [ ] All "96 planned" / "N of 96" copy → shipped reality; no page implies unshipped exports and no shipped chart still reads "planned" (plan/20 §16 anti-pattern).
- [ ] `/llms.txt`, `/llms-full.txt`, `.md` mirrors, `/catalog.json` regenerated + validated (all 200, generated from canonical sources, does-not-support list intact: pie/gauge/decoration answers — plan/20 §5).
- [ ] OG cards render **real charts** for chart pages and the default card (plan/20 §8 — product, not logo cards); preview-checked in the §8 debugger list; versioned URLs on changed images.
- [ ] `metadata.test.ts` green across all routes (canonical/title/description/OG/JSON-LD, plan/20 §11).

### B.5 plan/20 §14 P0 pre-flight
- [ ] Every item in plan/20 §14 "P0 before public announcement" (1–10) checked green against the built site — home live charts, quickstart, chart pages, a11y page with real generated summaries, performance page with reproducible commands, gallery with status truth, llms surfaces, OG set, README, Search Console + sitemap submitted.
- [ ] plan/20 §17 Definition of Done read as the final acceptance rubric — every bullet answerable "yes, and here's the artifact".

### B.6 Checkpoint 3 — cold-dev testing + API freeze (moved)
- [ ] **Checkpoint 3 now happens here, after the full catalog** (it was mid-roadmap; a 5-chart API freeze would have frozen the wrong surface). Cold-dev protocol: fresh machine/project, install from a tarball, build 3 real UIs (table, KPI grid, AI-chat render) using only public docs; every friction point filed before freeze.
- [ ] API freeze: shared grammar + all 96 prop surfaces reviewed for same-name-same-meaning drift (plan/21 §3.3 vocabulary audit: `shape`/`mode`/`style`/`orientation`/`label`/`emphasis`); breaking changes after this point follow semver, so this is the last cheap moment.
- [ ] Update plan/10 + STATUS.md to record the checkpoint relocation (plan-change write-back rule).

### B.7 Final whole-repo audit pass
- [ ] `bench/` re-run on the full catalog; published numbers (README, docs performance page) regenerated from output artifacts; ≥ 50 rows/ms SSR floor verified per chart scenario.
- [ ] Size table regenerated (`gen-size-limits` → size-limit → `sync-sizes`); every subpath within plan/21 §1 gates; barrel N measured and published honestly.
- [ ] Accessibility screen-reader pass: manual SR run (VoiceOver + NVDA) over one chart per collection + all seven flagships; axe clean repo-wide; summary exact-string tests green.
- [ ] Visual baselines approved light/dark × all presets for all 96 (Argos full-suite approval, not spot checks).
- [ ] knip / publint / attw / React 18+19 matrix / StrictMode green; `pnpm dlx` install smoke from the packed tarball.
- [ ] plan/12 audit entries for every research-backed claim shipped in this batch (incl. the token-confidence preprint hedge) — new factual claims classified.
- [ ] STATUS.md batch tracker closed out in the same commit as the last item.

---

## Batch-level risks / open questions

1. **volume-profile grammar novelty (flagged in-spec):** its primary axis is a companion chart's value axis; `SparkGroup` cannot bind cross-axis domains. Ships standalone + pairing recipe (explicit shared `domain`); cross-axis group binding is a logged v1.x follow-up. Watch for users misreading an unpaired profile as a time histogram — docs must show the paired form first.
2. **token-confidence is the first non-SVG chart:** HTML host bypasses `Chart.tsx`; needs its own a11y-naming path through `shared/a11y.ts`, a substitute for the containment test (wrap/overflow assertion), and confirmation that the visual-baseline harness screenshots HTML hosts identically. The tier-threshold default rests on a cautiously-cited 2026 preprint — plan/12 hedged entry required in the chart's PR; replication failure revisits defaults, never re-opens the gradient.
3. **station-glyph slot vocabulary containment:** `center`/`stick`/`corners` is deliberately glyph-local. Risk: future charts borrowing slot names with drifted meaning. Guard: plan/21 §3.3 vocabulary audit at Checkpoint 3 explicitly lists them as reserved-to-station-glyph.
4. **tape-gauge is the batch's animation ceiling:** scrolling-scale transform under live data must hold 60 fps and reduced-motion parity; the fixed-span rule (no auto-rescale during live updates) needs a browser test, not just a doc note. Node budget 9 documented-max — any creep past 12 fails the gate.
5. **dual-window-meter computes derived series** (rolling means) inside the chart — a first. The honesty cost is visibility: window sizes must be recoverable from every rendered instance's docs context. If review finds this too implicit, fallback is requiring a `windows` echo in the default label.
6. **depth-wedge linear-only** diverges from trading-native log-depth convention; expect requests. The answer is the documented steer, not a `scale` prop — revisit only with evidence that linear misleads at micro scale (it compresses, it doesn't lie).
7. **Per-cell node caps (event-raster 12 lanes, trace-fold 40 spans, partition-strip 24 segments, token-confidence ~500 spans):** each needs its documented-cap unit test wired to the plan/21 §1 per-cell budget rule — easy to forget since the shared ≤ 6 typical gate doesn't catch them.
8. **Sequencing dependency:** specs 1–20 assume Batch 0 kernel modules (`quantile`, `bin`, `stack`, `downsample`, `arc`) exist and are property-tested; none may land in this batch except as a same-PR addition per the template's "New core needs" rule. Batch 4 must not start before the Batch 3 gate (plan/21 §7).
9. **Release-gate honesty debt:** B.1/B.4 depend on the Batch 0 generators (`gen-size-limits`, `sync-sizes`) having stayed in CI all buildout long; if any hand-edited number crept in during Batches 1–3, B.7 catches it — budget a day for reconciliation rather than assuming zero drift.
