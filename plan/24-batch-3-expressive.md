# 24 — Batch 3: Expressive (22 types)

> Batch 3 spec · 2026-07-08 · template/checklist in [plan/21](21-full-catalog-buildout.md) ·
> single-package decision per plan/21 §0

## Overview

22 expressive types from [plan/15](15-expressive-charts.md), shipping as flat subpaths of
`@microcharts/react` (plan/21 §0 — the separate `@microcharts/expressive` package is dead; the
plan/15 header now carries the reversal note). `collection: "expressive"` is catalog metadata only.
Flagship docs/launch order: **MoonPhase, HeartbeatBlip, TreeRings, TallyMarks, PolarClock,
CitySkyline, FillWord** (plan/15 §rules). Implementation order below is simple → complex with the
four motion types **last** (plan/21 §7) — HeartbeatBlip is a flagship but still lands in the motion
block, because the motion infrastructure (loop gating, shared IntersectionObserver pause, verified
reduced-motion equivalents) is this batch's gate to Batch 4. Every chart passes the plan/15
survivor test: a sighted stranger reads the value back untrained (or with the allowed 1-line key);
charm never changes data meaning; presets restyle, never re-encode. Cut-ledger types stay cut.
Per-chart DoD: plan/09 §5 + plan/21 §5 registration checklist; standing rules plan/21 §8; variant
policy plan/21 §3; kernel modules only from plan/21 §6.0.C. Every summary here is a REAL string
(docs-as-tests) routed through `SummaryStrings` per-chart extensions — no hardcoded English
outside the `EN` tables.

A shared convention this batch introduces (documented once, reused): **area-true sizing** — any
mark whose *area* is the perceived channel (bubbles, weights, sand, moon disc) is solved so that
area, not a linear dimension, is proportional to the value. Each geometry section states its
closed form.

---

## Implementation order — non-motion (18)

### 1. TallyMarks — `tally-marks`

**Collection:** expressive · **Data shape:** S4 (`{ value: number }` → prop `value`) · **Source:** plan/15 E11
**Question it answers:** how many, counted the way a human counts?
**Primary encoding:** mark count in four-and-strike clusters of five · **Precision:** high (exact count read-back up to the cap)
**Default render:** viewBox `⌈width from count⌉×16` (integer; geometry returns it). Z-order: (1) one `<path>` containing every stroke — 4 verticals + 1 diagonal strike per complete cluster, then the remainder strokes; (2) optional overflow numeral `+N` (`text-anchor="start"`, tabular-nums, plan/18 anchor rule, `ch`-estimated gutter reserved by geometry). Node budget: 2. Tokens: `--mc-stroke` for marks, `--mc-neutral` for the overflow numeral.
**Props beyond shared grammar:**
- `value: number` (required) — the count; floored to an integer (documented).
- `max?: number` · default `25` — marks rendered before numeral overflow; keeps width bounded in table cells.
- `overflow?: "numeral" | "clamp"` · default `"numeral"` — `numeral` appends `+N`; `clamp` just stops drawing (summary still carries the true count — the honesty backstop).
- `style?: "ruled" | "drawn"` · default `"ruled"` — see variants.
**Variants (2):** `style="drawn"` → each stroke gets a seeded ±1.5° rotation + ±0.3 unit endpoint offset (`core/jitter.ts`, seed from `value`) for editorial/handwritten contexts — deterministic, SSR-stable, never `Math.random`; `overflow="clamp"` → dense cells where a numeral would double-print an adjacent value column.
**Geometry (`geometry.ts`):** `tallyGeometry({ value, max, height, strokeGap, clusterGap, style, pad }) → { d: string; width: number; drawn: number; overflow: number; numeralX: number | null }` — all coords 2-dp.
**New core needs:** `core/jitter.ts` (Batch 0) for the drawn variant.
**Interactive entry:** live announce on `value` change through the polite region (`tallySummary`); newly added strokes draw in via stroke-dashoffset (≤200 ms, once, reduced-motion → instant). No pointer/keyboard model beyond wrapper focus (a count has no sub-parts worth navigating) — wrapper `<span tabIndex={0} role="img">` per canon.
**Summary (`tallySummary`):** `{value} counted.` / with overflow drawn short: same string (count is always the true value). Example: **"23 counted."**
**Edge cases beyond the shared matrix:** `value = 0` → no marks, summary "0 counted."; negative → clamped to 0, documented; non-integer → floored, documented; `value > max` → cap + overflow behavior.
**Size budget:** static ≤ 1.5 kB / interactive ≤ 2.5 kB.
**Honesty notes:** marks are never resized to fit — width grows with count until `max`, then the numeral tells the truth. The drawn style perturbs stroke *rendering* only; count is unaffected (presets restyle, never re-encode).
**Docs page:** Playground knobs `value / max / style / overflow` · 4-context angle: RSVP count in a sentence, score cell, live event counter KPI, tab badge · why-default note: ruled default because product tables want precision first; drawn is the editorial voice.

### 2. DicePips — `dice-pips`

**Collection:** expressive · **Data shape:** S4 (`{ value: number }`) · **Source:** plan/15 E12
**Question it answers:** what is this small count/severity, instantly?
**Primary encoding:** canonical pip pattern 1–6 (subitized count) · **Precision:** high (exact, 0–6)
**Default render:** viewBox `16×16`. Z-order: (1) die face — rounded rect, hairline `--mc-band`-weight stroke, transparent fill; (2) pips — `<circle>` per pip at the canonical 3×3 grid positions (center / corners / mid-edges), fill `--mc-stroke`. Node budget: ≤ 7 (face + 6 pips). No labels/gutter needed.
**Props beyond shared grammar:**
- `value: number` (required) — integer 0–6; rounded, documented.
- `face?: boolean` · default `true` — `false` drops the outline for ultra-dense cells where the pip cluster alone reads.
**Variants (2):** `face={false}` → pips-only for repeated table columns (the column header carries the frame); **>6 behavior** (documented, not a prop): `value > 6` renders the face with a centered tabular numeral instead of pips — pip patterns above 6 are not subitizable, so the chart refuses to pretend (this is the spec'd overflow: numeral fallback, exact value preserved).
**Geometry (`geometry.ts`):** `dicePipsGeometry({ value, size, pad }) → { face: { x, y, width, height, rx }; pips: { cx, cy, r }[]; numeral: string | null }` — pip layout table is a module constant; 2-dp.
**New core needs:** none.
**Interactive entry:** live announce on change (`dicePipsSummary`); pip set cross-fades (opacity, ≤150 ms, reduced-motion → instant). No sub-part navigation (pips are one value) — wrapper focus only.
**Summary (`dicePipsSummary`):** `{value} out of 6.` Example: **"4 out of 6."** (>6: `{value}.` — e.g. "9.")
**Edge cases beyond the shared matrix:** `0` → empty face (documented: zero, not missing; `null` per shared matrix renders nothing); negative → treated as invalid per shared matrix; non-integer → rounded, documented.
**Size budget:** static ≤ 1.5 kB / interactive ≤ 2.5 kB.
**Honesty notes:** pip patterns are the canonical dice layouts only — no invented 7/8/9 patterns ever (numeral fallback instead). The face never changes size with value.
**Docs page:** Playground knobs `value / face` · 4-context: severity in a sentence, rating cell, incident-severity KPI, tab badge · why-default: the face outline keeps a lone die legible on any surface; the numeral fallback is the documented honesty rule, shown live at `value={7}`.

### 3. FillWord — `fill-word`

**Collection:** expressive · **Data shape:** S4 (`{ value: number }` fraction 0–1) · **Source:** plan/15 E2
**Question it answers:** how far along is this named task — where the label *is* the bar?
**Primary encoding:** horizontal inked fraction of the word's own glyph extent · **Precision:** medium (fill-edge position along text; glyph density varies ±~5%)
**Default render:** viewBox `⌈word.length·0.62·fontSize + 2·pad⌉×⌈fontSize·1.4⌉`. Z-order: (1) base `<text>` — the word in muted ink (`--mc-band`-class fill opacity ~0.25 of `--mc-stroke`); (2) accent `<text>` — identical string/position, fill `--mc-accent`, clipped by inline style `clipPath: "inset(0 {100·(1−value)}% 0 0)"` (no `<clipPath>` element → **no generated id**, canon-safe). Both texts carry `textLength` = the plan/18 0.62 em/char estimate with `lengthAdjust="spacingAndGlyphs"` so glyph extent is deterministic server-side and containment is provable without measurement. `font-size` set as an SVG attribute in viewBox units (plan/18). Node budget: 2 (+1 optional numeral). Tokens: `--mc-accent`, `--mc-stroke`, `--mc-font`.
**Props beyond shared grammar:**
- `word: string` (required) — the text that is the chart.
- `mode?: "fill" | "drain"` · default `"fill"` — see variants.
**Variants (3):** `mode="drain"` → ink empties left-to-right as `value` rises: the remaining-time story ("expiring", TTLs) that fill can't tell; `label="value"` → appends the percent numeral after the word (`text-anchor="start"` at the reserved `ch` gutter, tabular-nums) for contexts that need the exact number; RTL: fill direction follows `direction` inherited from the host (inset side flips) — documented, not a prop.
**Geometry (`geometry.ts`):** `fillWordGeometry({ value, word, fontSize, pad, mode }) → { textLength, x, y, insetPct, width, height }` — `insetPct = round2(100·(1−clamp01(value)))` (drain inverts); 2-dp.
**New core needs:** none (`makeFormatter` percent style for the label/summary).
**Interactive entry:** fill edge transitions on value change via CSS transition on `clip-path` (≤250 ms ease-out; reduced-motion → jump). Live region announces `fillWordSummary` on change, throttled to ≥1 s. Wrapper focus only (one value).
**Summary (`fillWordSummary`):** `{word}: {pct} complete.` (drain: `{word}: {pct} remaining.`) Example: **"uploading: 62% complete."**
**Edge cases beyond the shared matrix:** `value` clamped to [0,1], documented; empty `word` → renders nothing + `noData` summary; very long words → `textLength` compresses spacing (documented legibility floor ~14 chars at default size); `value` exactly 0/1 → fully muted / fully accent (no residual sliver).
**Size budget:** static ≤ 1.5 kB / interactive ≤ 2.5 kB.
**Honesty notes:** the fill is a fraction of the word's *own* inked extent (percentage inset), never of a hidden wider track — 50 % visually bisects the word. Because glyph ink is uneven, fine reads are ±5 %: the docs page states this and steers precision needs to `Progress`.
**Docs page:** Playground knobs `value / word / mode / label` · 4-context: "uploading" in a sentence, sync-status cell, quota KPI ("storage"), tab label that fills as a step completes · why-default: fill (not drain) because progress is the 90 % case; the label-is-the-bar trick is the hero demo.

### 4. FatDigits — `fat-digits`

**Collection:** expressive · **Data shape:** S4 (`{ value: number }` + tier domain) · **Source:** plan/15 E1
**Question it answers:** which numbers in this dense column are big, before I read them?
**Primary encoding:** the numeral itself (exact, symbolic) · **Precision:** high — the weight tier is a *redundant* preattentive channel (5 documented ordinal steps), never the primary read
**Default render:** viewBox `⌈len·0.62·fontSize + 2·pad⌉×⌈fontSize·1.4⌉`. One `<text>` node, tabular-nums, `font-size` as SVG attribute (plan/18), `font-weight` set from the tier table; digit mode adds one `<tspan>` per digit. Node budget: 1 (value mode) / ≤ len+1 (digit mode, documented). Tokens: `--mc-stroke`, `--mc-font`.
**Props beyond shared grammar:**
- `value: number` (required).
- `encode?: "value" | "digit"` · default `"value"` — see variants.
- `tiers?: 3 | 5` · default `5` — weight steps; 3 for fonts/hosts with few weights.
**Variants (2):** `encode="digit"` → per-digit weight = that digit's own magnitude (0–9 → tier), the table-scanning redundancy play for long ids/amounts; `tiers=3` → coarse tiers (400/550/750) where the host font ships few weights.
**Weight tier table (documented):** 5 tiers → `300 / 450 / 600 / 750 / 900`; 3 tiers → `400 / 550 / 750`. Value mode maps `value` through `domain` (linear, clamped) to a tier; digit mode maps digit 0–9 → `⌈(d+1)/ (10/tiers)⌉`. Without `domain` (and outside a `SparkGroup` shared domain) value mode renders the middle tier and the docs steer to always provide `domain` — a lone weight is meaningless.
**Geometry (`geometry.ts`):** `fatTier(value, domain, tiers) → number` (a font-weight); `fatDigitsGeometry({ value, domain, tiers, encode, format, fontSize, pad }) → { text: string; weight: number } | { glyphs: { char: string; weight: number }[] }` + shared box math; 2-dp.
**New core needs:** none.
**Interactive entry:** live announce on change; weight transitions via CSS `transition: font-weight` (animates on variable fonts, snaps otherwise) + tabular-nums number update (no layout shift). Wrapper focus only.
**Summary (`fatDigitsSummary`):** `{value} — tier {tier} of {tiers}.` Example: **"1,204 — tier 4 of 5."**
**Edge cases beyond the shared matrix:** value outside `domain` → tier clamped, numeral exact (documented); non-variable host font → browser snaps to nearest available weight (typically 2 effective tiers) — documented graceful degradation, numeral remains the exact primary channel.
**Size budget:** static ≤ 1.5 kB / interactive ≤ 2.5 kB.
**Honesty notes:** **Deviation from the FatFonts source (record in plan/12 §2026-07-08):** the research encodes magnitude as glyph *ink area* via custom fonts; shipping a font would break non-negotiable #1 (zero deps), so we adapt to discrete `font-weight` tiers on the *inherited* font. Weight is ordinal (5 steps), never claimed continuous; the numeral is always the exact value. True ink-area digits are a documented future `@microcharts/outline` capability.
**Docs page:** Playground knobs `value / domain / encode / tiers` · 4-context: KPI number, dense table column (the hero — a 10-row column scan), inline sentence amount, tab counter · why-default: value mode + 5 tiers because column scanning is the use case and 5 is the most steps that stay discriminable at text size.

### 5. Thermometer — `thermometer`

**Collection:** expressive · **Data shape:** S4 (`{ value, target?, range? }`) · **Source:** plan/15 E8
**Question it answers:** where does the value sit on a calibrated range, and how close to the goal?
**Primary encoding:** column extent in a ticked tube (position on a calibrated scale) · **Precision:** high (ticks calibrate the read)
**Default render:** vertical, viewBox `16×48`. Z-order: (1) bulb `<circle>` (filled, reservoir — always full, part of the instrument); (2) fill column `<rect>` (crispEdges, `--mc-accent` or `color`), width = tube inner width so **no clipPath/id is needed** — geometry keeps the rect inside the tube; (3) tube outline `<path>` (hairline `--mc-stroke` at reduced opacity, capsule + bulb merged, drawn over the fill); (4) ticks `<path>` (one path, hairline); (5) optional target tick `<line>` (accent, thicker — distinct shape from ticks, never color-alone); (6) optional value label (plan/18 anchored, `ch` gutter reserved right of the tube). Node budget: ≤ 6.
**Props beyond shared grammar:**
- `value: number` (required).
- `target?: number` — goal tick; the fundraising story.
- `ticks?: number | readonly number[]` · default `5` — count (even spacing over `domain`) or explicit values; calibration is what buys the high precision rating.
- `orientation?: "vertical" | "horizontal"` · default `"vertical"` — horizontal fits table cells (shared vocab, plan/21 §3).
- `bulb?: boolean` · default `true` — `false` = plain capsule; horizontal cells usually drop it.
`domain` (shared) defaults to `[0, 100]` — a calibrated instrument needs a stated range; auto-fit would silently move the scale (documented).
**Variants (4):** `orientation="horizontal"` → row/cell embedding; `bulb={false}` → neutral capsule when the metaphor is too warm for the context; `ticks=[…]` explicit → domain-meaningful calibration (freezing point, phase gates); `label="value"` → numeral at the fill line.
**Geometry (`geometry.ts`):** `thermometerGeometry({ value, domain, target, ticks, width, height, orientation, bulb, pad }) → { tube: string; fill: { x, y, width, height }; bulb: { cx, cy, r } | null; tickLines: { x1, y1, x2, y2 }[]; targetTick: { x1, y1, x2, y2 } | null; overflow: boolean }` — 2-dp.
**New core needs:** none (`core/scale`).
**Interactive entry:** hover reveals the value label at the fill line; fill height transitions on change (CSS, ≤250 ms; reduced-motion → jump); focus announces `thermometerSummary`; live announce on target crossing. Pointer math: none needed (single value) — hover is a reveal, not a lookup.
**Summary (`thermometerSummary`):** `{value} on a {min}–{max} scale{; target {target}}.` Example: **"72 on a 0–100 scale; target 80."**
**Edge cases beyond the shared matrix:** `value` outside `domain` → fill clamps and an over-cap notch renders at the tube end; the summary always states the true value (never silently clipped meaning); `target` outside domain → tick clamped + documented.
**Size budget:** static ≤ 2 kB / interactive ≤ 3 kB.
**Honesty notes:** the tube is a linear calibrated scale — never log, never re-zeroed; fill always anchors at `domain[0]`. The bulb is instrument chrome, not data (documented so nobody reads its area).
**Docs page:** Playground knobs `value / target / domain / ticks / orientation / bulb` · 4-context: fundraising sentence, capacity cell (horizontal), goal KPI card, tab progress · why-default: vertical + bulb because the instrument metaphor is the point; horizontal exists for cells where vertical can't fit.

### 6. MoonPhase — `moon-phase`

**Collection:** expressive · **Data shape:** S4 (`{ value: number }` fraction 0–1) · **Source:** plan/15 E4 · flagship
**Question it answers:** how far through the cycle/period are we — readable across cultures?
**Primary encoding:** illuminated fraction of the disc (area) · **Precision:** medium (area fraction reads to ~10 %; steer exact needs to `Progress`)
**Default render:** viewBox `16×16`. Z-order: (1) base disc `<circle>` (muted, `--mc-band`-class fill); (2) lit region `<path>` (fill `--mc-stroke` or `color`); (3) hairline outline `<circle>`. Node budget: 3. Waxing lights from the right (documented; RTL hosts flip via `direction`).
**Props beyond shared grammar:**
- `value: number` (required) — fraction 0–1.
- `mode?: "progress" | "cycle"` · default `"progress"` — see variants.
**Variants (2):** `mode="progress"` (default) → **monotonic** illumination: 0 = new (dark), 0.5 = half, 1 = full — the sprint/quota story needs monotonic, and pretending the real lunar cycle is monotonic would lie; `mode="cycle"` → true lunar mapping (0 = new, 0.5 = full, 1 = new again, waxing then waning) for genuinely cyclic data. The mode is a data-semantic switch, hence `mode` per shared vocabulary.
**Geometry (`geometry.ts`):** `moonGeometry({ value, mode, size, pad }) → { disc: { cx, cy, r }; litPath: string; litFraction: number }`. **Area-true closed form (documented):** the terminator is a semi-ellipse with `rx = r·|2f−1|`; lit area = semicircle ± semi-ellipse = exactly `f·πr²` — illumination fraction equals the value with no approximation. Path built from `core/arc.ts` circular + elliptical arc primitives; 2-dp.
**New core needs:** `core/arc.ts` (Batch 0) — circular/elliptical arc path segments.
**Interactive entry:** hover reveals the percent numeral beside the disc; on value change the lit path cross-fades (opacity swap of old/new path, ≤200 ms — **no `d:` interpolation in CSS**, per plan/03; reduced-motion → instant swap); live announce throttled ≥1 s. Wrapper focus only.
**Summary (`moonPhaseSummary`):** `{pct} of the cycle complete.` Example: **"68% of the cycle complete."** (cycle mode: `{pct} through the cycle.`)
**Edge cases beyond the shared matrix:** clamped to [0,1], documented; exactly 0/1 → clean new/full discs (no hairline sliver artifacts — geometry snaps `rx` at the extremes).
**Size budget:** static ≤ 2 kB / interactive ≤ 3 kB.
**Honesty notes:** lit *area* equals the fraction exactly (the closed form above) — never the phase-angle approximation, which under-lights mid-cycle. Progress vs cycle semantics are a `mode`, never a preset (presets restyle, never re-encode).
**Docs page:** Playground knobs `value / mode / color` · 4-context: sprint progress in a sentence, billing-period cell, quota KPI card, release-cycle tab · why-default: progress mode because period-progress is the demand; the cycle mode demo uses real lunar data for delight that stays honest.

### 7. Hourglass — `hourglass`

**Collection:** expressive · **Data shape:** S4 (`{ value: number }` elapsed fraction 0–1) · **Source:** plan/15 E10
**Question it answers:** how much time is gone *and* how much remains — the two-sided story Progress can't tell?
**Primary encoding:** sand area split top (remaining) / bottom (elapsed) · **Precision:** medium (area in triangular bulbs; the label variant carries exact reads)
**Default render:** viewBox `16×24`. Z-order: (1) top sand `<path>` (muted `--mc-neutral`-class fill — remaining); (2) bottom sand `<path>` (fill `--mc-stroke` or `color` — elapsed); (3) frame `<path>` (two hairline triangles meeting at the neck); (4) stream `<line>` (1-unit hairline at the neck) rendered **only while `0 < value < 1`** — it encodes "running", a state, not decoration. Node budget: 4.
**Props beyond shared grammar:**
- `value: number` (required) — elapsed fraction (consistent with `Progress`).
- `stream?: boolean` · default `true` — suppress the running cue in contexts that already show state.
**Variants (2):** `label="remaining" | "elapsed"` → prints the percent that matters to the context (TTL cells want remaining; retro reports want elapsed), anchored beside the glass per plan/18; `stream={false}` → static print/e-ink contexts.
**Geometry (`geometry.ts`):** `hourglassGeometry({ value, width, height, pad }) → { frame: string; topSand: string; bottomSand: string; stream: { x, y1, y2 } | null }`. **Area-true closed forms (documented):** top bulb is an apex-down triangle — remaining fraction `r = 1−value` fills from the apex to height `h = H·√r`; bottom bulb apex-up — elapsed `e = value` fills from the base to `h = H·(1−√(1−e))`. Sand areas are exactly proportional to elapsed/remaining; a naive linear-height fill would overstate early progress by up to 2×. 2-dp.
**New core needs:** none.
**Interactive entry:** sand levels transition on value change (path swap + cross-fade ≤250 ms, reduced-motion → instant); live announce at documented thresholds (50 %, 90 %, 100 %) via `hourglassSummary`, not on every tick. Wrapper focus only.
**Summary (`hourglassSummary`):** `{elapsedPct} elapsed, {remainingPct} remaining.` Example: **"75% elapsed, 25% remaining."**
**Edge cases beyond the shared matrix:** clamped [0,1]; `0` → all sand top, no stream; `1` → all bottom, no stream (finished state is shape-distinct, not color-alone).
**Size budget:** static ≤ 2 kB / interactive ≤ 3 kB.
**Honesty notes:** the area-true solve is the load-bearing honesty rule (lie factor 1 in an inherently nonlinear container). The stream is a binary state mark, never animated in the static entry.
**Docs page:** Playground knobs `value / label / stream` · 4-context: deadline sentence, TTL table cell, session-expiry KPI, time-boxed tab · why-default: elapsed-as-value matches `Progress` so the two compose in one product without re-learning polarity.

### 8. BalanceBeam — `balance-beam`

**Collection:** expressive · **Data shape:** S2, exactly two items (`[{ label, value }, { label, value }]`) · **Source:** plan/15 E9
**Question it answers:** which side outweighs, and roughly by how much?
**Primary encoding:** beam tilt direction + angle (saturating) with area-true weights as the secondary channel · **Precision:** medium (direction is instant; magnitude reads coarsely — docs steer exact ratios to `PairedBars`/`Delta`)
**Default render:** viewBox `48×20`. Z-order: (1) fulcrum `<path>` (small triangle, `--mc-neutral`); (2) beam `<line>` (hairline `--mc-stroke`) with endpoint coordinates **pre-rotated by geometry** (no SVG transform in the static entry → containment is provable from coords); (3) two weight marks (`<rect>` or `<circle>`) sitting on the beam ends, area ∝ value; (4) optional value labels under each side (anchored middle, tabular). Node budget: ≤ 6.
**Props beyond shared grammar:**
- `data: readonly [{ label: string; value: number }, { label: string; value: number }]` (required).
- `maxTilt?: number` · default `12` — degrees at full saturation; documented clamp (see honesty).
- `shape?: "square" | "round"` · default `"square"` — shared variant vocabulary (plan/21 §3).
**Variants (3):** `shape="round"` → softer product contexts (weights as pans); `label="values"` → prints both numerals for exact reads; `mode="difference"` → tilt from absolute difference scaled by `domain` instead of the default ratio-normalized `(a−b)/(a+b)` — lets same-scale rows in a table tilt comparably.
**Geometry (`geometry.ts`):** `balanceBeamGeometry({ a, b, width, height, maxTilt, mode, domain, shape, pad }) → { tiltDeg: number; beam: { x1, y1, x2, y2 }; fulcrum: string; weights: [{ cx, cy, half }, { cx, cy, half }] }` — weight `half` (half-side or radius) = `k·√value` (area-true); tilt = `clamp(normalized, −1, 1)·maxTilt`; rotated endpoint/weight coords computed in geometry, 2-dp.
**New core needs:** none.
**Interactive entry:** hover a side (nearest-half pointer math) reveals its label + value; arrow keys Left/Right focus sides, announced as `{label}: {value}.` via the point pattern; on data change the beam animates via CSS `transform: rotate()` on a client-only group (compositor-friendly; the client entry may use transforms because it re-renders — reduced-motion → instant). Live region announces `balanceBeamSummary` when the heavier side flips.
**Summary (`balanceBeamSummary`):** `{leftLabel} {leftValue} vs {rightLabel} {rightValue}; {heavierLabel} heavier.` / balanced: `…; balanced.` Example: **"Inflow 620 vs outflow 480; inflow heavier."**
**Edge cases beyond the shared matrix:** `a === b` → level beam, "balanced" summary; both 0 → level + documented; negative values → invalid for weights (shared-matrix null handling), documented steer to `Delta` for signed comparisons.
**Size budget:** static ≤ 2 kB / interactive ≤ 3 kB.
**Honesty notes:** tilt **saturates** at `maxTilt` — documented as "read direction and rough magnitude, not exact ratio"; the docs page shows the saturation curve. Weights are area-true (`√value`). The two channels always agree in direction.
**Docs page:** Playground knobs `data / shape / maxTilt / mode / label` · 4-context: buy/sell sentence, in/out table cell, pro/con KPI, A-vs-B tab pair · why-default: ratio mode because most two-sided comparisons are share-of-whole questions; square weights because circles under-read area at this size.

### 9. SproutRow — `sprout-row`

**Collection:** expressive · **Data shape:** S2 ordinal (`{ label: string; value: 0 | 1 | 2 | 3 }[]`) · **Source:** plan/15 E6
**Question it answers:** how mature/healthy is each item in this small set?
**Primary encoding:** ordinal growth-stage glyph (seed → sprout → leaf → bloom), glyph height strictly monotonic with stage · **Precision:** high (4 discrete states; the allowed 1-line key names the stages, but ordering reads untrained because taller = further along)
**Default render:** viewBox `⌈n·step⌉×20`. One `<path>` per item — the four stage glyphs are hand-designed module-constant path data at unit scale (seed: dot; sprout: stem + single leaf; leaf: stem + leaf pair; bloom: stem + flower head), translated to each slot by geometry-computed coordinates baked into the `d`. Baseline hairline `<line>` (the soil — one node, shared ground for the ordinal height read). Optional category labels under slots (`text-anchor="middle"`, static-anchored per plan/18 §4, omitted below a documented width threshold). Node budget: n+1 (+n labels), n ≤ 12 documented.
**Props beyond shared grammar:**
- `data: readonly { label: string; value: number }[]` (required) — `value` = stage 0–3, rounded + clamped, documented.
- `labels?: boolean` · default `false` — category labels (default off at micro scale; the interactive entry announces them).
**Variants (2):** `labels` → editorial/KPI contexts wide enough for names; `label="value"` → prints the stage number above each glyph for audit-grade reads.
**Geometry (`geometry.ts`):** `sproutRowGeometry({ n, width, height, gap, pad }) → { slots: { x, baselineY }[]; step: number }` + `STAGE_PATHS: readonly [string, string, string, string]` (unit-scale `d` constants) + `placedPath(stage, slot) → string`; 2-dp.
**New core needs:** none.
**Interactive entry:** roving 1-D keyboard (Left/Right) + single pointer listener with nearest-slot lookup; announce `{label}: {stageName}, stage {k} of 4.` (stage names live in the chart's `SummaryStrings` extension — i18n contract). Hover raises the focused glyph's opacity ring.
**Summary (`sproutRowSummary`):** `{n} items; {bloomCount} at bloom, {seedCount} at seed.` Example: **"6 accounts; 2 at bloom, 1 at seed."**
**Edge cases beyond the shared matrix:** out-of-range stage → clamped, documented; `null` stage → empty slot with soil tick (missing ≠ seed — documented distinction); single item.
**Size budget:** static ≤ 2 kB (path constants are the weight) / interactive ≤ 3 kB.
**Honesty notes:** stages are ordinal and exactly four — no interpolated half-stages (a growth metaphor must not fake continuity). Glyph height is strictly monotonic with stage so the read survives without the key; presets recolor, never reshape stages.
**Docs page:** Playground knobs `data / labels / label` · 4-context: account-health sentence, portfolio table column, project-maturity KPI, per-env tab markers · why-default: labels off because the row usually sits beside its own row label; the 1-line key ("seed → sprout → leaf → bloom") appears once above demos.

### 10. GardenGrid — `garden-grid`

**Collection:** expressive · **Data shape:** S1 binned (`number[]` + row layout, ActivityGrid's sibling) · **Source:** plan/15 E7
**Question it answers:** what's the rhythm of activity over time — legible in grayscale and print?
**Primary encoding:** dot **area** in a grid, quantized to 5 documented steps (mirrors ActivityGrid's discrete color steps) · **Precision:** medium (ordinal 5-step read; per-cell exact reads steer to `ActivityGrid` + hover label or `HeatStrip`)
**Default render:** viewBox from `columns×rows` grid math. One `<circle>` per cell (1 node/cell, per-cell budget per plan/21 §1), fill `--mc-stroke` (single-ink — the print superpower); zero-value cells render a hairline **ring** (presence without magnitude); `null` cells render nothing (missing ≠ zero — documented). Node budget: 1/cell, documented cap 400 cells. Rows default 7 (weekly rhythm).
**Props beyond shared grammar:**
- `data: readonly (number | null)[]` (required).
- `rows?: number` · default `7` — `1` = strip mode for table cells.
- `steps?: 3 | 5` · default `5` — radius quantization steps.
- `empty?: "ring" | "blank"` · default `"ring"` — how zeros render.
**Variants (3):** `rows=1` → in-cell strip (the densest embedding); `steps=3` → tiny cells where 5 radii stop being discriminable; `empty="blank"` → sparse data where rings would dominate the ink.
**Geometry (`geometry.ts`):** `gardenGridGeometry({ values, rows, cell, gap, steps, domain, pad }) → { cells: { cx, cy, r, step }[]; cols, width, height }` — radius table is **area-quantized**: step k of S → `r = rMax·√(k/S)` so perceived area steps evenly; binning by `domain` (default data min/max, zero-anchored), 2-dp.
**New core needs:** none (`core/scale`; calendar alignment stays an ActivityGrid feature — if demanded here later it reuses `core/calendar.ts`).
**Interactive entry:** identical model to ActivityGrid per canon — single pointer listener + grid lookup (floor-divide to cell), 2-D roving keyboard (arrows), announce `{index label}: {value}, step {k} of {S}.`; hover ring on the focused cell. Static composed, overlay marks as children.
**Summary (`gardenGridSummary`):** `{n} periods; peak {max}, {active} active.` Example: **"12 weeks; peak 34, 9 active."**
**Edge cases beyond the shared matrix:** all-zero → all rings (documented as "present, quiet"); domain collapse (all-equal) → all cells at the top step + flat summary; cap overflow → documented error steer to downsampling upstream.
**Size budget:** static ≤ 2.5 kB / interactive ≤ 3.5 kB.
**Honesty notes:** radius is √-quantized so **area** carries the ordinal — a linear radius map would exaggerate highs quadratically. Steps are ordinal; the docs say "read rhythm and rank, not values" and point at ActivityGrid for the color twin.
**Docs page:** Playground knobs `rows / steps / empty / domain` · 4-context: contribution sentence, per-repo table strip, team-activity KPI, per-project tabs · why-default: rings for zero because print/grayscale loses the zero/missing distinction that color grids get for free — this chart exists for exactly that medium.

### 11. BubbleRow — `bubble-row`

**Collection:** expressive · **Data shape:** S2 (`{ label, value }[]`) · **Source:** plan/15 E22 · **the honesty exemplar**
**Question it answers:** roughly how do these few magnitudes compare, with physical presence?
**Primary encoding:** circle area (r ∝ √value) · **Precision:** **low** — area comparison is the weakest common channel; **the docs page carries a standing steer: "for precise comparison, use `MiniBar`"** (this exact sentence ships; the chart exists for presence, not precision)
**Default render:** viewBox `⌈Σ diameters + gaps⌉×⌈2·rMax + labelGutter⌉`. Z-order: (1) one `<circle>` per item, fill `--mc-accent` at documented opacity with hairline stroke (touching, center-aligned row); (2) value numerals **on by default** — `label="value"` is the default because a low-precision channel owes the reader the number (anchored middle at each `cx`, plan/18, gutter reserved above). Node budget: 2n, n ≤ 8 documented.
**Props beyond shared grammar:**
- `data: readonly { label: string; value: number }[]` (required).
- `align?: "center" | "baseline"` · default `"center"` — baseline (bottom-aligned) reads as weights on a shelf; center reads as a specimen row.
**Variants (3):** `label="none"` → the explicit opt-*out* of the numerals (documented as reducing an already-low-precision chart to impression only); `label="both"` → label + value for editorial callouts; `align="baseline"` → shelf composition for KPI cards.
**Geometry (`geometry.ts`):** `bubbleRowGeometry({ values, height, gap, rMax, align, pad }) → { bubbles: { cx, cy, r }[]; width }` — `r = rMax·√(value/max)`, always; width derives from radii (touching), 2-dp.
**New core needs:** none.
**Interactive entry:** nearest-bubble pointer lookup + Left/Right roving; announce `{label}: {value}.`; hover thickens the bubble's stroke. 
**Summary (`bubbleRowSummary`):** `{n} items; largest {maxLabel} at {maxValue}, smallest {minLabel} at {minValue}.` Example: **"4 regions; largest EMEA at 1,240, smallest LATAM at 210."**
**Edge cases beyond the shared matrix:** zero → 0.5-unit point ring (presence), documented; negative → invalid (shared-matrix handling) + documented steer to signed charts; single item → one bubble + numeral.
**Size budget:** static ≤ 2 kB / interactive ≤ 3 kB.
**Honesty notes:** r ∝ √value with no exceptions (linear-r would be a ~squared lie); no sorting prop (order = data order — reordering is the caller's statement, not ours); the LOW rating and the MiniBar steer are printed in the catalog entry, `/catalog.json`, and the docs page header — this chart is the catalog's worked example of an honest low-precision admission.
**Docs page:** Playground knobs `data / align / label` · 4-context: market-size sentence, region cell, portfolio KPI, segment tabs · why-default: values-on because area lies quietly; the page opens with the same data as BubbleRow *and* MiniBar side by side.

### 12. MusicStaff — `music-staff`

**Collection:** expressive · **Data shape:** S1 (`number[]`) · **Source:** plan/15 E13
**Question it answers:** what's the shape of this short series, read as melody?
**Primary encoding:** vertical position on a 5-line staff (pitch = value, order = time), quantized to line/space positions · **Precision:** medium (9–13 discrete positions; exact reads steer to `Sparkline` + label)
**Default render:** viewBox `60×20`. Z-order: (1) staff `<path>` — five hairline horizontal lines, muted (`--mc-stroke` at low opacity); (2) ledger lines `<path>` — short ticks only where a note sits above/below the staff; (3) note heads — one `<ellipse>` per point (rx ≈ 1.3·ry, filled `--mc-stroke`). **No clefs, stems, beams, or bar lines — pitch is the only channel and every other convention is decor** (per spec constraint). Node budget: n+2, n ≤ 16 documented.
**Props beyond shared grammar:**
- `data: readonly (number | null)[]` (required).
- `range?: "staff" | "ledger"` · default `"ledger"` — see variants.
**Variants (2):** `range="staff"` → values clamp to the 9 on-staff positions (dense cells where ledger lines would collide with neighbors; clamping is documented in the cell's summary); `label="last"` → tabular numeral after the final note (plan/18 anchored, `ch` gutter).
**Geometry (`geometry.ts`):** `musicStaffGeometry({ values, domain, width, height, positions, pad }) → { staffYs: readonly number[]; notes: { cx, cy, rx, ry, pos }[]; ledger: { x1, x2, y }[] }` — values scale over `domain` then quantize to the nearest of 9 staff positions (5 lines + 4 spaces) extended ±2 ledger positions (13 total) in ledger range; 2-dp.
**New core needs:** none (`core/scale`).
**Interactive entry:** sparkline model per canon — one pointer listener, nearest-x lookup, hover dot ring + value label; arrows step notes with `EN.point` announcements ("Point 3 of 6: 4."). 
**Summary:** reuses **`describeSeries`** verbatim (same S1 pipeline as Sparkline — no new template). Example for `[3, 5, 4, 8, 6, 9]`: **"Trending up 200%. Range 3 to 9. Last value 9."** (docs embed the real generated string, docs-as-tests).
**Edge cases beyond the shared matrix:** quantization collisions (two adjacent equal values) → coincident-pitch notes are horizontally spaced by the time axis, never dodged vertically (that would change pitch = lie); values beyond ledger range → clamped + documented; `null` → rest gap (no note, no ledger).
**Size budget:** static ≤ 2 kB / interactive ≤ 3 kB.
**Honesty notes:** quantization to staff positions is the documented precision limit (stated on the page: "reads in steps, like a melody"); `domain` default is data min/max mapped to the 13 positions — per-instance auto-scaling, so cross-row comparison requires `SparkGroup` shared domain (same rule as Sparkline).
**Docs page:** Playground knobs `data / range / label / domain` · 4-context: weekly-rhythm sentence, table cell, "how the sprint went" KPI, per-channel tabs · why-default: ledger range because clipping pitch silently is worse than two extra hairlines; the sonification bridge is one docs paragraph, no audio shipped.

### 13. TreeRings — `tree-rings`

**Collection:** expressive · **Data shape:** S1 (`number[]`, oldest first → center outward) · **Source:** plan/15 E3 · flagship
**Question it answers:** how did growth accumulate, period over period?
**Primary encoding:** radial ring **thickness** (spacing between consecutive rings) ∝ per-period value · **Precision:** medium (radial-extent comparison; exact per-period reads steer to `SparkBar`)
**Default render:** viewBox `24×24`. Z-order: (1) one hairline `<circle>` per period boundary, muted `--mc-stroke`; (2) accent ring — the current (outermost) period's boundary circle in `--mc-accent`, 1.5× stroke weight (shape + weight, not color alone); (3) optional center dot. Node budget: n+1, n ≤ 24 documented (yearly data).
**Props beyond shared grammar:**
- `data: readonly number[]` (required) — per-period growth, oldest first.
- `accent?: "last" | "none" | number` · default `"last"` — which period boundary is emphasized (`number` = index).
- `total?: number` — expected lifetime Σ; when provided, ring thicknesses scale so the disc fills only `Σdata/total` of the radius — the cohort-age story ("this account is 3 of an expected 8 years old").
**Variants (3):** `style="fill"` → alternating annulus fills instead of stroke rings (print/e-ink contexts where hairlines drop out; built on `core/arc.ts` annulus paths; documented render styling, data meaning identical per shared `style` vocabulary); `accent=index` → mark an anniversary/era, not just "now"; `label="last"` → latest period's value at the outer edge (anchored, plan/18).
**Geometry (`geometry.ts`):** `treeRingsGeometry({ values, size, pad, total }) → { rings: { r, value }[]; maxR; center: { cx, cy } }` — `thickness_i = value_i / (total ?? Σvalues) · (maxR − r0)`, cumulative radii, 2-dp.
**New core needs:** `core/arc.ts` (annulus builder, fill variant only).
**Interactive entry:** pointer radial lookup (distance from center → ring index — the canonical arc lookup), hover thickens that ring + shows `{period}: {value}`; arrows step rings inner→outer with point announcements; live region on data append ("new ring") reduced-motion-gated draw-in.
**Summary (`treeRingsSummary`):** `{n} periods; latest {last}, biggest {max} in period {argmax}.` Example: **"8 years; latest 14, biggest 22 in year 5."**
**Edge cases beyond the shared matrix:** zero-value period → zero-thickness (boundary circles coincide — honest; documented, and the coincident-mark legibility rule applies: the accent ring always renders on top); negative → invalid, documented; 1 period → single ring.
**Size budget:** static ≤ 2 kB / interactive ≤ 3 kB.
**Honesty notes:** the channel is radial **thickness**, and the docs must say so explicitly, because equal thickness at larger radius spans more *area* — the classic ring illusion. Never encode by area here; never enforce a minimum visual thickness (a near-zero year must look near-zero).
**Docs page:** Playground knobs `data / accent / style / total` · 4-context: account-age sentence, cohort table cell, company-history KPI, per-cohort tabs · why-default: stroke rings (not fills) because at 24 px hairlines keep the disc quiet and the accent ring loud.

### 14. CitySkyline — `city-skyline`

**Collection:** expressive · **Data shape:** structured (`{ label: string; value: number; lit?: number }[]` — `lit` = 0–1 fraction; two variables *is* the story, per plan/05 §1 escape clause) · **Source:** plan/15 E21 · flagship
**Question it answers:** how do groups compare on size, and how activated is each?
**Primary encoding:** building height (position/length) · **Precision:** high for height; the secondary lit-window fraction is **low** and documented as such (read it as "mostly lit / half lit / dark", not a number)
**Default render:** viewBox `⌈n·(bw+gap)⌉×24`. Z-order per building: (1) building `<rect>` (crispEdges, fill `--mc-stroke` at high opacity — the dark tower); (2) lit windows — **one `<path>` per building** containing every lit window as a subpath rect (fill `--mc-accent`); plus (3) one ground hairline `<line>` across the row. Window grid: fixed 2 columns, rows ∝ height (window unit + gutter are geometry constants); `litCount = round(lit · windowCount)`, **filled bottom-up** — deterministic, never scattered, so the lit fraction reads as a fill level inside each building. Node budget: 2n+1, n ≤ 8 documented.
**Props beyond shared grammar:**
- `data: readonly { label: string; value: number; lit?: number }[]` (required) — omit `lit` everywhere and it's a skyline-styled bar row (windows off).
- `labels?: boolean` · default `false` — category labels under buildings (static-anchored, plan/18 §4, dropped below width threshold).
- `ground?: boolean` · default `true` — the shared baseline hairline (anchors the height read).
**Variants (3):** `labels` → editorial contexts; `label="value"` → numeral above each building (anchored middle); `ground={false}` → when the host row already draws a rule.
**Geometry (`geometry.ts`):** `citySkylineGeometry({ data, width, height, gap, domain, pad }) → { buildings: { x, y, w, h, windowsPath: string, windowCount, litCount }[]; ground: { x1, x2, y } }` — heights zero-anchored over `domain` (default `[0, max]`), 2-dp.
**New core needs:** none (`core/scale`).
**Interactive entry:** x-band pointer lookup → hover building highlight (stroke) + label; Left/Right roving; announce `{label}: {value}; {litPct} lit.`; live region on data change.
**Summary (`citySkylineSummary`):** `{n} groups; tallest {label} at {value}.` Example: **"5 teams; tallest Platform at 46."**
**Edge cases beyond the shared matrix:** building too short for any window row → solid tower, `lit` still reported in summary/hover (documented: the secondary channel drops out visually before the primary ever does); `lit` outside [0,1] → clamped; zero-height → ground tick only.
**Size budget:** static ≤ 2.5 kB / interactive ≤ 3.5 kB.
**Honesty notes:** heights are always zero-anchored (bars); lit windows are quantized to the window count with rounding documented; **no roofline variation, antennas, or third-variable ornament ever** — width, roof, and ground are constants (earn every mark). Never encode anything in building width.
**Docs page:** Playground knobs `data / labels / ground / label` · 4-context: team-size sentence, region table row, org KPI card, per-BU tabs · why-default: windows on when `lit` present because the two-variable read is why this beats MiniBar; the page shows the same data as MiniBar for the honesty comparison.

### 15. Honeycomb — `honeycomb`

**Collection:** expressive · **Data shape:** S4 (`{ value: number; total: number }` — occupancy of capacity) · **Source:** plan/15 E20
**Question it answers:** how many of the available slots are taken?
**Primary encoding:** filled-cell count in an area-filling hex grid (unit counting) · **Precision:** high (units are countable; total ≤ 60 documented)
**Default render:** viewBox from hex-grid math. Exactly **two `<path>` nodes**: one containing every filled hex (fill `--mc-accent`), one containing every empty hex (hairline `--mc-stroke` outline, no fill) — merged subpaths keep the node count O(1) regardless of `total`. Pointy-top hexes, odd-row offset packing, near-square aspect by default. Fill order: row-major from top-left (deterministic, documented — occupancy reads as a sweep). Node budget: 2.
**Props beyond shared grammar:**
- `value: number` (required) — filled count; fractional values round to the nearest cell (documented; the summary always carries the exact number).
- `total?: number` · default `10` — capacity = cell count.
- `rows?: number | "auto"` · default `"auto"` (near-square packing) — `1` = hex strip for table cells.
- `empty?: "outline" | "dim"` · default `"outline"` — dim = filled at low opacity for dark surfaces where hairlines vanish.
**Variants (3):** `rows=1` → strip embedding; `empty="dim"` → AMOLED/dark contexts; documented cap: `total > 60` → build-time docs steer to `Progress` (unit counting stops being countable — refusing is the feature).
**Geometry (`geometry.ts`):** own hex math (per spec constraint): `hexPath(cx, cy, r) → string`; `honeycombGeometry({ total, value, rows, cellR, gap, pad }) → { cells: { cx, cy, filled }[]; filledPath: string; emptyPath: string; width; height; filledCount }` — axial→pixel conversion, 2-dp.
**New core needs:** none (hex math stays chart-local; nothing else in the catalog needs it).
**Interactive entry:** live announce on change + hover reveals the count numeral (`{value} of {total}`); no per-cell keyboard nav — cells are anonymous units, not addressable data points (documented skip of the grid-nav pattern). Wrapper focus reads the summary.
**Summary (`honeycombSummary`):** `{value} of {total} filled.` Example: **"34 of 40 seats filled."**
**Edge cases beyond the shared matrix:** `value > total` → all cells filled + summary states the true value (documented overflow, never silently clipped); `total = 0` → `noData`; `value` fractional → rounding documented.
**Size budget:** static ≤ 2 kB / interactive ≤ 3 kB.
**Honesty notes:** the unit is the cell — cell size never changes with value (count varies, geometry doesn't); this is area-filling *occupancy* semantics, deliberately distinct from `PictogramRow` unit counts of unlike things (docs draw the line).
**Docs page:** Playground knobs `value / total / rows / empty` · 4-context: seats sentence, capacity cell (strip), occupancy KPI, per-venue tabs · why-default: outline empties because takenness must survive grayscale; auto packing because a near-square honeycomb is the recognizable form.

### 16. Constellation — `constellation`

**Collection:** expressive · **Data shape:** S1 points (`{ x: number; y?: number; m?: number }[]` — time × value, optional magnitude) · **Source:** plan/15 E5
**Question it answers:** when did the rare events happen, and how big were they?
**Primary encoding:** position (x = time, y = value) with area-true dot size for magnitude · **Precision:** medium (sparse positional read; magnitude area is low and documented)
**Default render:** viewBox `60×20`. Z-order: (1) connector `<path>` — one polyline through the points in time order, hairline at low opacity (`--mc-band`-class ink — the constellation line); (2) one `<circle>` per event, fill `--mc-stroke`, `r = rBase·√(m/mMax)` when `m` given, else `rBase`. Node budget: n+1, n ≤ 12 documented (this is for *rare* events; dense events steer to `Seismogram`/`EventTimeline`).
**Props beyond shared grammar:**
- `data: readonly { x: number; y?: number; m?: number }[]` (required).
- `connect?: boolean` · default `true` — the faint chronology line; off for pure scatter.
- `xDomain?: readonly [number, number]` — time extent (default data min/max); `domain` (shared) covers y.
**Variants (2):** `connect={false}` → events with no meaningful sequence narrative; `label="max"` → numeral at the largest event (anchored per plan/18).
**Y-jitter rule:** when `y` is omitted, vertical position comes from `core/jitter.ts` seeded by the data (deterministic — never `Math.random`, SSR/hydration-stable) and **encodes nothing** — the docs state this in bold and the summary never references vertical position in that case.
**Geometry (`geometry.ts`):** `constellationGeometry({ points, width, height, domain, xDomain, rBase, pad }) → { stars: { cx, cy, r }[]; connectorPath: string | null; jittered: boolean }` — seed derived from the data values, 2-dp.
**New core needs:** `core/jitter.ts` (Batch 0).
**Interactive entry:** nearest-point (2-D distance) pointer lookup, hover ring + label `{xLabel}: {value}{, magnitude {m}}`; Left/Right steps chronologically; live region on new event append.
**Summary (`constellationSummary`):** `{n} events between {first} and {last}; largest at {argmaxLabel}.` Example: **"4 incidents between Jan and Jun; largest in Mar."**
**Edge cases beyond the shared matrix:** single event → one star, no connector; simultaneous events (equal x) → rendered at same x, jitter never applied to x (time is sacred); all-jittered-y + `connect` → connector still time-ordered (documented).
**Size budget:** static ≤ 2 kB / interactive ≤ 3 kB.
**Honesty notes:** dot size is √-area-true; jittered y is layout, not data (see rule above); the connector is chronology only — its slope means nothing when y is jittered, so `connect` defaults are revisited in docs for that case (page shows both).
**Docs page:** Playground knobs `data / connect / label` · 4-context: outage sentence, incident table cell, milestone KPI, per-service tabs · why-default: connectors on because sequence is usually the story of rare events; the jitter honesty note is called out in the page's "why this default".

### 17. PolarClock — `polar-clock`

**Collection:** expressive · **Data shape:** S1 cyclic (`number[]`, one value per hour/day/segment of the cycle) · **Source:** plan/15 E18 · flagship
**Question it answers:** what's the shape of the day/week cycle — when is it busy?
**Primary encoding:** radial bar length at the value's fixed cycle angle · **Precision:** medium (radial-length comparison; exact reads steer to `SparkBar` over the unrolled cycle)
**Default render:** viewBox `24×24`. Z-order: (1) inner guide `<circle>` (hairline, muted — the zero baseline all bars grow from); (2) segments — **one `<path>`** containing every radial sector as a subpath (`core/arc.ts` annulus sectors from `r0` outward, single fill `--mc-stroke`); (3) accent `<path>` — the `now` segment re-drawn in `--mc-accent` (position + color, never color alone). 0 position at 12 o'clock, clockwise (documented convention). Node budget: 3.
**Props beyond shared grammar:**
- `data: readonly (number | null)[]` (required) — n segments = n cycle divisions (24 hourly, 7 daily, any n).
- `now?: number` — index of the current segment to accent.
- `inner?: number` · default `0.35` — inner radius fraction `r0` (see honesty).
- `start?: number` · default `0` — index rendered at 12 o'clock (locale week-start / midnight rotation).
**Variants (3):** `mode="opacity"` → fixed-length sectors, value drives 5-step fill opacity — the radial ActivityGrid for very small sizes where length can't be read (data-semantic channel switch, hence `mode`); `labels` → four cardinal ticks (0/¼/½/¾ of the cycle) as hairline marks; `label="max"` → numeral at the peak segment.
**Geometry (`geometry.ts`):** `polarClockGeometry({ values, size, inner, start, pad }) → { segmentsPath: string; segments: { a0, a1, r0, r1, index }[]; accentPath: string | null; guide: { cx, cy, r } }` — angles in radians from 12 o'clock clockwise, lengths scaled over `domain` (default `[0, max]`, zero-anchored), 2-dp.
**New core needs:** `core/arc.ts` (Batch 0) — sector/annulus builders.
**Interactive entry:** pointer angle lookup (`atan2` → segment index — the canonical arc lookup), hover lifts that sector's opacity + shows `{segmentLabel}: {value}`; Left/Right arrows step segments **circularly**; live region announces the focused point.
**Summary (`polarClockSummary`):** `Peaks at {peakLabel} ({max}); quietest {minLabel}.` Example: **"Peaks at 14:00 (312); quietest 04:00."** (segment labels come from a `formatSegment` option defaulting to index — hour formatting for n=24, weekday via `SummaryStrings` for n=7.)
**Edge cases beyond the shared matrix:** `null` segment → gap (no sector, guide circle shows the hole — missing ≠ zero); all-equal → uniform ring + flat summary; n=1 → full annulus.
**Size budget:** static ≤ 2.5 kB / interactive ≤ 3.5 kB.
**Honesty notes:** the channel is radial **length from `r0`**, not sector area — outer ends of equal-value bars span more area, which is why `r0 > 0` (reduces the distortion) and why the docs say "compare lengths, not wedges". Bars always zero-anchored at `r0`; never area-encode.
**Docs page:** Playground knobs `data / now / inner / mode / start` · 4-context: "your day" sentence, per-service table cell, traffic-shape KPI, per-region tabs · why-default: length mode because the cycle *shape* is the story; opacity mode exists for the 16-px cell where length dies.

### 18. SpiralYear — `spiral-year`

**Collection:** expressive · **Data shape:** S1 calendar series (`number[]`, one value per day/week + optional start date) · **Source:** plan/15 E19
**Question it answers:** how did the year breathe — seasonality at a glance?
**Primary encoding:** 5-step opacity of marks along an Archimedean spiral (angle = position in the year, turn = year N) · **Precision:** **low** — opacity steps are the weakest ordered channel; **docs steer point reads to `ActivityGrid`/`HeatStrip`** (this is a pattern instrument, stated on the page)
**Default render:** viewBox `24×24`. Marks grouped by opacity step into **≤ 5 `<path>` nodes** (each path = all dots of that step as circle subpaths — per-cell budget satisfied at O(steps), not O(days)); optional month ticks — one hairline `<path>` of 12 radial ticks. Angle 0 = 12 o'clock = Jan 1 (or `startDate`), clockwise; spiral radius grows outward per turn (radius encodes **time only**, never value — documented). Node budget: ≤ 7. Cap: 366 marks/turn, ≤ 3 turns documented.
**Props beyond shared grammar:**
- `data: readonly (number | null)[]` (required) — daily (365/366) or weekly (52) cadence, inferred from length, overridable via `cadence?: "day" | "week"`.
- `startDate?: string` — ISO date anchoring index 0 to a calendar angle (via `core/calendar.ts`); without it, index 0 sits at angle 0.
- `steps?: 3 | 5` · default `5` — opacity quantization.
- `monthTicks?: boolean` · default `true` — the 12 faint radial ticks that make "when" readable.
**Variants (3):** `steps=3` → tiny sizes; `monthTicks={false}` → non-calendar cycles (release trains); `mark="arc"` → short arc segments instead of dots (continuous-ribbon feel for dense daily data; `core/arc.ts`; rendering style, data meaning identical).
**Geometry (`geometry.ts`):** `spiralYearGeometry({ values, size, steps, cadence, startIndex, turns, pad }) → { marks: { cx, cy, r, step }[]; stepPaths: readonly string[]; monthTicks: { x1, y1, x2, y2 }[] }` — Archimedean `r(θ) = r0 + k·θ/2π`, 2-dp.
**New core needs:** `core/arc.ts` (arc-mark variant) + `core/calendar.ts` (day-of-year → angle, month boundaries) — both Batch 0.
**Interactive entry:** nearest-mark pointer lookup (2-D), hover shows `{periodLabel}: {value}`; Left/Right steps chronologically along the spiral; live region per point pattern.
**Summary (`spiralYearSummary`):** `{n} {periods}; peak {max} in {peakLabel}, low in {minLabel}.` Example: **"52 weeks; peak 480 in week 30, low in week 6."**
**Edge cases beyond the shared matrix:** partial year → spiral stops (no phantom marks); multi-year (> 366·turns) → documented cap + steer; `null` → missing mark (gap in the spiral, distinct from a step-1 dot).
**Size budget:** static ≤ 2.5 kB / interactive ≤ 3.5 kB.
**Honesty notes:** opacity is 5-step-quantized, ordinal only; spiral radius never encodes value; two adjacent turns put different years at the same angle — the docs warn that inter-turn radial adjacency is calendar alignment, not similarity.
**Docs page:** Playground knobs `data / steps / monthTicks / mark / startDate` · 4-context: seasonality sentence, per-store table cell, "the year in one square" KPI, per-year tabs · why-default: month ticks on because without a temporal anchor the spiral is just texture; 5 steps as the ceiling of ordered-opacity discriminability.

---

## Implementation order — motion types (4, last within batch; gate = verified reduced-motion equivalents)

Shared rules for all four (spec'd once, applied verbatim): **motion IS the encoding** — the documented
exception to the no-idle-loop rule (plan/06 §5), allowed *only* where the loop parameter (rate,
period, position) is itself the datum; requires the plan/06 amendment flagged in §Open questions.
Animation is CSS/WAAPI only (no `d:` interpolation in CSS, no SMIL), transform/opacity preferred,
started in `client.tsx` via `element.animate()`. Every animation is (a) gated on
`prefers-reduced-motion` with the **static entry's frame as the equivalent** (not a paused
mid-animation pose), (b) paused when off-viewport via the shared IntersectionObserver, (c) quantized
to documented parameter steps so the motion is *readable*, not vibes. Static default entries render
a meaningful frame with zero client JS — they are real charts, not placeholders. Boundary rule
(documented on both pages): **discrete events → HeartbeatBlip; continuous level → BreathingDot.**

### 19. BreathingDot — `breathing-dot`

**Collection:** expressive · **Data shape:** S4 (`{ value: number }` continuous level 0–1) · **Source:** plan/15 E15
**Question it answers:** how loaded/strained is the system right now — ambiently?
**Primary encoding:** (interactive) pulse rate + amplitude ∝ level — calm/slow/small = low, fast/large = high; (static) ring offset ∝ level · **Precision:** **low** (ambient status; docs steer exact reads to `Progress`/`Sparkline`)
**Default render (static frame — meaningful, mandatory):** viewBox `16×16`. (1) core `<circle>` (fixed r, fill by threshold band token: `--mc-positive` calm / `--mc-neutral` elevated / `--mc-negative` strained — never color-alone, see ring); (2) level ring `<circle>` — hairline, radius = `rCore + level·(rMax−rCore)`: the ring's distance from the core IS the static level read; (3) optional percent numeral. Node budget: 3.
**Props beyond shared grammar:**
- `value: number` (required) — level 0–1, clamped.
- `thresholds?: readonly [number, number]` · default `[0.5, 0.8]` — calm/elevated/strained band edges; drive color token, summary band word, and motion band.
**Variants (2):** `label="value"` → percent numeral beside the dot (the exact-read escape hatch on a low-precision chart); `thresholds` tuning → domain-meaningful bands (SLO-derived), a data-semantic knob documented as such.
**Geometry (`geometry.ts`):** `breathingDotGeometry({ value, size, thresholds, pad }) → { core: { cx, cy, r }; ring: { cx, cy, r }; band: 0 | 1 | 2 }` — 2-dp.
**New core needs:** none.
**Interactive entry (motion = encoding):** composes the static component; WAAPI `transform: scale()` pulse on the core dot — period lerps 4 s (level 0) → 0.9 s (level 1), amplitude 4 % → 18 %, both continuous but **snapped to re-read at 3 documented bands** (the animation restarts with new parameters only on band change, so the motion states are nameable: calm / elevated / strained). Loop allowed: the loop *is* the level (documented exception). Reduced motion → exactly the static frame (ring + tokens). Off-viewport → paused. Live region announces **band changes only** (`breathingDotSummary`), never per-tick. Wrapper focus reads the summary.
**Summary (`breathingDotSummary`):** `Load {pct} — {bandWord}.` Example: **"Load 42% — calm."** (band words in the `SummaryStrings` extension.)
**Edge cases beyond the shared matrix:** `NaN`/`null` → gray core, no ring, summary "Load unknown." (documented unknown state, shape-distinct); value pinned at threshold edge → band assignment is `<` lower / `≥` upper, documented.
**Size budget:** static ≤ 1.5 kB / interactive ≤ 2.5 kB.
**Honesty notes:** band colors are always doubled by ring offset (static) or pulse rate (motion); the pulse never runs when the value is unknown (an unknown system must not look calm).
**Docs page:** Playground knobs `value / thresholds / label` · 4-context: "the cluster right now" sentence, per-node table cell, ops KPI, per-env tabs · why-default: three bands because ambient motion supports about three discriminable states — more would be false precision; boundary-rule cross-link to HeartbeatBlip.

### 20. HeartbeatBlip — `heartbeat-blip`

**Collection:** expressive · **Data shape:** structured events (`number[]` of event timestamps + window) · **Source:** plan/15 E14 · flagship
**Question it answers:** is it alive, and how busy — instantly?
**Primary encoding:** (interactive) a spike per arriving event; rate = spike frequency; flatline = down; (static) spike positions across the recent window · **Precision:** medium (presence/density; exact counts steer to `Seismogram`/`EventTimeline`)
**Default render (static frame — meaningful, mandatory):** viewBox `60×16`. (1) baseline `<line>` (hairline `--mc-stroke`); (2) spikes — one `<path>` with an ECG-style spike glyph (up-over-down, ~3 units wide) at each event's x, where `x = (t − (now − window)) / window · width`; (3) "now" endpoint dot at the right edge. Zero events in window → the path is empty and the flat baseline *is* the down signal — shape, not color. Node budget: 3.
**Props beyond shared grammar:**
- `data: readonly number[]` (required) — event timestamps (ms).
- `window?: number` · default `60_000` — the visible recent window.
- `now?: number` · default `max(data)` — **explicit clock for SSR determinism**: the static entry must never call `Date.now()` (hydration mismatch); docs instruct passing `now` from the data layer. The client entry may advance its own clock.
**Variants (2):** `label="count"` → event count numeral at the right (anchored, plan/18); `window` presets shown in docs (60 s / 5 min) — a data-semantic knob, documented.
**Geometry (`geometry.ts`):** `heartbeatGeometry({ events, window, now, width, height, pad }) → { baseline: { x1, x2, y }; spikesPath: string; nowDot: { cx, cy, r }; count: number; lastAgoMs: number | null }` — events outside the window dropped; events after `now` clamped (documented clock-skew handling); 2-dp.
**New core needs:** none.
**Interactive entry (motion = encoding):** composes the static component inside a translating group: the trace **sweeps left** in real time (WAAPI `transform: translateX`, linear, duration = `window`, restarted on data change — the loop parameter is elapsed time, i.e. the datum). Each arriving event: its spike enters at the right + one endpoint pulse (single scale pulse, never repeated). Blip frequency = event rate, readable directly. Down transition: after `window` with no events the trace is fully flat and a small "no events" text state renders (shape + words, never color-alone). Reduced motion → no sweep, no pulse: the static strip re-renders on each data change (identical information, discretely updated) + live-region announce. Off-viewport → sweep paused. Keyboard: wrapper focus reads the summary; no sub-navigation (spikes are transient events, the summary is the record — documented).
**Summary (`heartbeatSummary`):** `{n} events in the last {windowLabel}; last {ago} ago.` / flat: `No events in the last {windowLabel}.` Example: **"12 events in the last minute; last 3s ago."**
**Edge cases beyond the shared matrix:** empty `data` → flatline + flat summary; all events older than window → flatline (down ≠ no-data: summary distinguishes); event bursts denser than spike width → spikes overlap into a block (documented; steer dense analysis to Seismogram).
**Size budget:** static ≤ 2 kB / interactive ≤ 3 kB.
**Honesty notes:** every spike is one real event — never synthesized "heartbeat" pulses on a timer (a fake pulse on a dead service is the one unforgivable lie for this chart; the docs say exactly this). Rate is shown, never smoothed.
**Docs page:** Playground knobs `data / window / label` (+ a live event-firehose demo) · 4-context: liveness sentence, per-service table cell, uptime KPI, per-region tabs · why-default: 60 s window because liveness questions are about the last minute; boundary-rule cross-link to BreathingDot.

### 21. CometTrail — `comet-trail`

**Collection:** expressive · **Data shape:** S1 rolling window (`number[]`, oldest → newest; last = now) · **Source:** plan/15 E16
**Question it answers:** where is the value now, and where has it just been?
**Primary encoding:** head-dot vertical position (current value) + opacity-fading positional trail (recent history) · **Precision:** medium (position read for the head; trail is qualitative; full history steers to `Sparkline`)
**Default render (static frame — meaningful, mandatory):** viewBox `60×16`. (1) trail — one `<circle>` per prior point, opacity stepped down with age over 5 documented steps (newest ≈ 0.7 → oldest ≈ 0.1), fill `--mc-stroke`; (2) head dot `<circle>` (`--mc-accent`, larger); (3) default `label="last"` numeral after the head (anchored, `ch` gutter — the now-value is the point of this chart). Node budget: ≤ trail+2, trail default 12, documented cap 20. This static frame is a decaying dot-sparkline — fully readable with zero JS.
**Props beyond shared grammar:**
- `data: readonly number[]` (required) — the rolling window, newest last.
- `trail?: number` · default `12` — points kept visible.
**Variants (2):** `trail` length → how much recency context a cell affords; `label="none"` → composed inside KPI cards that print the number themselves.
**Geometry (`geometry.ts`):** `cometTrailGeometry({ values, width, height, domain, trail, pad }) → { trail: { cx, cy, r, opacityStep }[]; head: { cx, cy, r }; labelX: number }` — x = age position (newest at right), y scaled over `domain`, 2-dp.
**New core needs:** none.
**Interactive entry (motion = encoding):** composes the static component; on each data update the head dot **moves** to its new position via `transform: translate` transition (150–250 ms ease-out — plan/06 "a fact being corrected") and the previous head decays into the trail (opacity steps down). Motion occurs **only on data change** — no idle loop at all (this type doesn't need the loop exception). A continuous stream produces the comet effect; a stalled stream goes still, which is itself the signal (staleness reads as stillness). Reduced motion → instant reposition, trail unchanged (static encoding is already complete). Keyboard: focus reads the summary; Left arrow steps back through the trail (`{k} updates ago: {value}` via the point pattern), Right returns toward now.
**Summary (`cometTrailSummary`):** `Now {last}, {trendWord} over the last {n} updates.` (trend word from `seriesStats` direction, via `SummaryStrings`.) Example: **"Now 87, rising over the last 12 updates."**
**Edge cases beyond the shared matrix:** single point → head only + `Now {v}.`; all-equal → straight horizontal trail + "steady" trend word; window shorter than `trail` → render what exists.
**Size budget:** static ≤ 2 kB / interactive ≤ 3 kB.
**Honesty notes:** opacity encodes **age only**, never value (the y position does value); trail length is context, not data — changing `trail` never changes the head read. Never interpolate phantom intermediate positions between updates (the dot jumps to truth, eased, not simulated).
**Docs page:** Playground knobs `data / trail / label` (+ live ticking demo) · 4-context: live-price sentence, per-metric table cell, realtime KPI, per-stream tabs · why-default: `label="last"` on because a live value without its number is a mood, not a measurement.

### 22. OrbitStatus — `orbit-status`

**Collection:** expressive · **Data shape:** structured (`{ latency: number; rate: number }` — two live variables per row) · **Source:** plan/15 E17
**Question it answers:** how slow and how busy is this dependency right now?
**Primary encoding:** orbit radius = latency; (interactive) angular speed = call rate, (static) orbit dash density = call rate · **Precision:** **low** (two rough ambient channels; docs steer exact reads to `Sparkline` for latency + `Delta`/`MiniBar` for rate — stated on the page)
**Default render (static frame — meaningful, mandatory):** viewBox `20×20`. (1) center dot `<circle>` (the service, `--mc-stroke`); (2) orbit `<circle>` — hairline, radius scaled from `latencyDomain`, `stroke-dasharray` computed so **dash count = rate quantized to 5 documented steps** (denser dashes = busier; a static texture encoding of frequency, decodable with the allowed 1-line key "denser dashes = more calls"); (3) satellite `<circle>` at a fixed deterministic angle (−90°, top — the angle encodes nothing statically, documented). Node budget: 3.
**Props beyond shared grammar:**
- `latency: number` (required) · `rate: number` (required).
- `latencyDomain?: readonly [number, number]` · default `[0, 2·latency]` — documented as weak; docs insist on explicit domains (a lone orbit radius is meaningless), same steer as FatDigits.
- `rateDomain?: readonly [number, number]` · default `[0, 2·rate]` — same.
- `alert?: number` — latency threshold: at/above it the satellite doubles in size and the summary flags it (shape + words, never color-alone).
**Variants (2):** `label="latency"` → ms numeral beside the orbit (the exact-read escape hatch); `alert` → SLO-derived attention state.
**Geometry (`geometry.ts`):** `orbitStatusGeometry({ latency, rate, size, latencyDomain, rateDomain, alert, pad }) → { center: { cx, cy, r }; orbit: { cx, cy, r, dash: readonly [number, number], rateStep: 1|2|3|4|5 }; satellite: { cx, cy, r, alerted: boolean } }` — dash lengths from circumference (`core/arc.ts` arc-length helpers) so dash count is exact at any radius; 2-dp.
**New core needs:** `core/arc.ts` (Batch 0) — arc-length/dash math.
**Interactive entry (motion = encoding):** composes the static component; the satellite orbits via WAAPI `transform: rotate` on a client group centered on the service dot — angular period quantized to the same **5 documented speed steps** as the static dash steps (so motion and static frames decode identically); orbit radius transitions on latency change (≤250 ms). Loop allowed: the loop rate *is* the call rate (documented exception). Reduced motion → the static frame exactly (dash density already carries rate). Off-viewport → paused. Live region announces threshold crossings only (`{title}: latency high — {latency}.`). Wrapper focus reads the summary.
**Summary (`orbitStatusSummary`):** `{latency} latency at {rate} calls/s{ — above alert threshold}.` Example: **"240ms latency at 12 calls/s."**
**Edge cases beyond the shared matrix:** `latency`/`rate` of 0 → satellite sits on the center dot / solid (dash-free) orbit — both documented; `NaN`/unknown → gray static frame, no motion (unknown must not look healthy); values beyond domains → clamped, summary carries true values.
**Size budget:** static ≤ 2 kB / interactive ≤ 3 kB.
**Honesty notes:** both channels are quantized to 5 steps and documented as ordinal; radius and speed always come from the same domains in static and interactive entries (no drift); the satellite's angular *position* never encodes anything (only its speed does) — documented so nobody reads the angle.
**Docs page:** Playground knobs `latency / rate / domains / alert / label` (+ live per-row demo table) · 4-context: dependency sentence, service-table row (the hero — 8 rows of orbits), infra KPI, per-region tabs · why-default: dash-density static encoding because a paused satellite says nothing — the static frame had to carry both variables or the type failed the survivor test.

---

## Batch-level risks & open questions

1. **FatFonts adaptation is a recorded deviation (blocking plan/12 entry).** The source research
   encodes magnitude as glyph ink *area* via custom fonts; we ship discrete `font-weight` tiers on
   the inherited font instead (zero-dep, non-negotiable #1). Must land in plan/12 §2026-07-08 with
   this rationale before `fat-digits` merges; true ink-area digits are noted as future
   `@microcharts/outline` territory. Fallback on non-variable fonts (~2 effective tiers) is
   documented graceful degradation.
2. **Plan conflict: looping animation — RESOLVED 2026-07-08.** plan/06 §5 now carries the
   motion-as-encoding carve-out (E14–E17 only, client entries only, reduced-motion gated with
   meaningful static equivalents, decoration loops still banned everywhere) + plan/12 audit entry.
   The motion block is unblocked; the carve-out's off-viewport pause requirement (shared
   IntersectionObserver) still applies as specced below.
3. **Reduced-motion equivalents are this batch's gate** (plan/21 §7): each motion type's
   reduced-motion state must be byte-identical to its static entry's render (asserted in the
   browser-project tests), not a paused animation pose. HeartbeatBlip additionally needs an
   SSR-determinism test around the `now` prop (no `Date.now()` in `index.tsx`).
4. **FillWord rendering technique needs a one-time verification spike:** `clip-path: inset()` on
   SVG `<text>` (avoiding generated ids) and `textLength`/`lengthAdjust="spacingAndGlyphs"`
   behavior must be confirmed against the visual-test browser matrix before the API freezes; if
   `inset()` proves unreliable on any supported engine, the fallback design is a `<pattern>`-free
   two-rect + `mask`-less re-spec — decide in the spike, record in plan/12.
5. **Read-back risks to watch in visual review:** SpiralYear (low, opacity — pattern instrument
   only, steer is load-bearing), OrbitStatus dash-density (requires its allowed 1-line key),
   BalanceBeam tilt saturation (docs must show the clamp), GardenGrid radius steps at ≤ 8 px cells
   (may force `steps=3` default at small sizes — revisit after baselines), BubbleRow is the
   catalog's designated LOW exemplar and its MiniBar steer sentence is part of the DoD.
6. **SummaryStrings growth:** this batch adds ~20 template families. Keep per-chart string tables
   co-located with their `‹slug›Summary` exports but typed against a shared extension pattern so
   the i18n contract stays one surface; no hardcoded English outside `EN` tables (canon).
7. **Node-budget techniques to standardize:** merged-subpath rendering (Honeycomb 2 paths,
   PolarClock 1 path, SpiralYear ≤ 5 step-paths, CitySkyline 1 windows-path per building) should be
   asserted by each chart's node-budget unit test; if a shared `mergePaths` helper falls out,
   it belongs in `core/path.ts` with property tests.
8. **Honeycomb/PolarClock/TreeRings pointer math** (hex nearest-center, angle lookup, radial
   lookup) are the first non-rectilinear lookups in the library — land them as pure exported
   geometry functions so the browser tests can property-test hit-testing without DOM geometry.
9. **Coincident-mark legibility** (memory: chart-legibility practices): TreeRings zero-thickness
   rings, MusicStaff equal-pitch notes, and HeartbeatBlip burst overlap all have documented
   coincidence behavior above — verify in dark-theme baselines that merged marks stay legible.
