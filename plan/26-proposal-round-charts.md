# 26 — Proposal-round charts (8): specs

> Status: approved 2026-07-10 (user, superaudit proposal round). Catalog 98 → 106.
> Provenance: 3 research passes + rejection ledger in audit/PROPOSALS.md; designs on the proposal-board artifact.
> Every chart follows the component canon (CLAUDE.md), plan/04 §8 contract, and audit/FAMILY-BRIEF.md conventions
> (width/cat/ink roles, seat-gate, craft-gate attribute contract, Emil motion ruling). DoD identical to batches 1–4.

Common to all 8: static `index.tsx` (hook-free) + `client.tsx` interactive entry + pure `geometry.ts` (2-dp) +
node tests (geometry edge+property, static attrs, axe, summary docs-as-tests) + `client.browser.test.tsx` +
`tests/visual/<slug>.spec.ts` (four contexts + variants + presets) + craft-matrix cases + bench scenario
(floor = placeholder, orchestrator recalibrates from quiet measure ×0.75) + size-budget entry + subpath exports +
tsdown entries + docs registry module + mdx page (full guideline: Edge cases, Four homes, locale where `format`,
literal snippets) + strings module (self-contained interface + `EN_*`; SummaryStrings/EN-aggregate wiring is
orchestrated serially, not by the chart agent).

## 1. CohortTriangle — grid · decision
Story: which vintage retains worst, compared at equal maturity. Data: `data: readonly {label: string, values: readonly Value[]}[]`
(ragged rows: values[i] = retention at age i, 0–1 or 0–100 auto-detected like other % charts — pick one, document).
Render: rows = cohorts (input order top→bottom), cols = age; cell = rect, `data-mc-ink="cell"` + fillOpacity quantized
to 5 levels (ActivityGrid convention); `cell`/`gap` props (default 9/2 viewBox units); optional row labels seat-gated.
`highlight` (cohort label) = ring around that row (`data-mc-ink` none — stroke accent via explicit attrs + `data-mc-w="support"`).
Worst-vintage auto-flag OFF by default (keep marks honest; summary names it). Summary: n cohorts, worst cohort at the
deepest common age + its value, newest cohort's first reading. Edges: single cohort, empty, all-equal, NaN cells (render
as gap slots `data-mc-ink="gap"`). Cap: 12 cohorts × 12 ages (dev-warn beyond). Size ≤ 2.2/3.2 kB. Interactive: 2-D
arrow nav (ActivityGrid pattern), announce "Mar cohort, month 3: 24%".

## 2. StreakSpark — strip · decision
Story: current run vs record, with run texture. Data: `data: readonly (0 | 1 | boolean | null)[]` (null = gap, breaks runs)
— or `Value[]` + `threshold?: number`. Geometry: collapse to runs `{ok, len, start}`; bar width ∝ len on shared scale;
ok-runs `data-mc-ink="positive"` fillOpacity .45 height 8; fail-runs `negative` .8 height 6 (centered); CURRENT run:
`accent`, full opacity, height 10 + count label (seat-gated). Record run: small triangle tick above (`point` ink) +
optional "best N" label via `label: "current" | "both" | "none"` (default "current"). `positive: "up" | "down"` maps
which outcome is the streak. Summary: current run, record run, break count. Edges: all-pass (one bar = current = record),
all-fail, empty, single. Cap 40 runs (merge oldest into ellipsis slot, dev-warn). Size ≤ 1.8/2.8 kB. Interactive: ←/→
roves runs, announces "run 4: 9 passing, record".

## 3. GradeProfile — band · expressive
Story: how hard is the route, where. Data: `data: readonly {d: number, elev: number}[]` (d monotonic, any units).
`bins?: readonly [number, number, number]` default `[3, 6, 10]` (% grade thresholds — documented, quantized, NEVER a
continuous ramp). Render: per-segment quads (flat-to-baseline) filled by bin: bin0 `band` ink, bin1 `data-mc-cat="1"`,
bin2 `negative`, bin3 `bar` (stroke ink = the brutal bin); ridge polyline on top `data` ink + `data-mc-w="full"`.
Descents always bin0 (climb difficulty is the story; document). `label: "max" | "none"` (default "max"): summit hair tick +
"12% max" text. Below 72 viewBox width: bins collapse to climb/flat (documented degrade). Summary: total distance, gain,
max grade + where. Edges: flat route, single point, descent-only, NaN elev (gap). Size ≤ 2.4/3.4 kB. Interactive: pointer
x → segment readout "km 18: 9.5%, 620 m gained".

## 4. WinProbWorm — line · frontier
Story: who's winning, when did it flip. Data: `data: readonly Value[]` clamped 0–100 (out-of-range dev-warn), y-axis FIXED
0–100 (never truncated — honesty rule). `sides?: readonly [string, string]` (names for >50 / <50, default "A"/"B").
Render: 50-midline `muted`+`hair` dashed; polyline split at 50-crossings (interpolated): >50 segments `accent` stroke
`data-mc-w="full"`, <50 segments `neutral`; crossing dots `point` r 1.8; endpoint dot + `label: "last" | "none"` → "98%".
`markSwing?: boolean` default true: largest |Δ| segment gets a hair connector + seat-gated "+31" text. Summary: leader
now + prob, flip count, biggest swing index; "per the supplied model" phrasing. Edges: constant 50, starts decided (100),
single point, nulls (gap). Size ≤ 2.2/3.2 kB. Interactive: pointer x → "Q3: home 64%".

## 5. QueueDepth — band · decision
Story: backlog stock vs capacity — draining or growing. Data: `data: readonly Value[]` (depth ≥ 0, zero-anchored area);
`capacity?: number` (hairline `muted`+`hair` dashed + label seat-gated). Render: area fill `accent` fillOpacity .22 +
top edge `accent` stroke `support`; spans above capacity re-stroked `negative` `data-mc-w="full"` (shape+color);
endpoint dot + `label: "last" | "none"` (value + trend glyph ▴/▾ from last-k slope, k=25% of series). Summary: current
depth, vs capacity ("2.1× capacity" when breached), draining/growing over the last quarter of the window. Edges: empty,
zero-everywhere, always-above-capacity, no capacity given, nulls (gap). Size ≤ 2.2/3.2 kB. Interactive: pointer x →
"t14: 214 queued, above capacity".

## 6. SpreadBand — line · decision
Story: which of two series leads, by how much, since when. Data: `data: readonly {a: Value, b: Value}[]` (a = subject,
b = reference; null in either = gap in both). `labels?: readonly [string, string]`. Render: signed gap fill split at
interpolated crossings — a>b regions `positive` fillOpacity .3, a<b `negative` .28 (flip if `positive="down"`);
subject line `data` ink `full`; reference `muted` + `support`; crossing dots `point`; `label: "gap" | "none"` default
"gap": last-gap value in leader valence, seat-gated. Summary: leader + current gap, last flip position. Edges: never
cross, identical series (zero band, lines coincide — render one line + "no gap" summary), single point, all-null.
Size ≤ 2.4/3.4 kB. Interactive: pointer x → "May: organic +11% over paid".

## 7. BiasStrip — dot · frontier
Story: systematic bias between two paired measurement methods (Bland–Altman 1986). Data: `data: readonly {a: number, b: number}[]`;
x = (a+b)/2 mapped to width, y = (a−b) centered on 0. `limits?: number` default 1.96 (k·σ LoA). Render: LoA band rect
`band` ink; zero line `muted`+`hair` dashed; bias mean line `accent` stroke `support` + seat-gated "+2.1 bias" label
(`label: "bias" | "none"`); dots `point` ink fillOpacity .75 r 1.5; dots beyond LoA `negative` ink r 1.8. Cap 40 dots
(uniform downsample, dev-warn, doc'd). Summary: bias (mean diff), % within limits, n pairs. Edges: perfect agreement
(bias 0, band collapses to hair), n<5 (dots only, no band — micro-box precedent), single pair, NaN pairs dropped.
Size ≤ 2.4/3.4 kB. Interactive: pointer → nearest dot "pair 12: mean 41.2, diff +3.1, outside limits".

## 8. PercentileTrace — line · decision
Story: one entity's standing drifting inside a population. Data: `data: readonly Value[]` — PERCENTILE RANKS 0–100
(y-axis fixed 0–100; because y IS rank, the population bands are constant by definition — key simplification).
Render: fixed bands p25–75 (`band` ink) and p5–95 (`band` at half opacity) as rects; `bands?: false` hides; entity
polyline `accent` `full`; endpoint dot + `label: "last" | "none"` → "p81". `positive` maps whether up is good.
Summary: current percentile, change from first reading, band crossed ("moved above the middle half"). Edges: constant,
single point, nulls (gap), out-of-range clamp + dev-warn. Size ≤ 2.2/3.2 kB. Interactive: pointer x → "week 6: p68".

## Wiring (orchestrated serially — chart agents DO NOT edit these)
package.json exports ×2/chart · tsdown entries · scripts/size-budgets.json · bench/scenarios.mjs · tests/craft/matrix.mjs
cases · core/summary.ts SummaryStrings members + core/strings.ts EN aggregate · apps/docs registry.ts MODULES ·
apps/docs content/docs/charts/meta.json. Floors recalibrated from quiet bench post-build.
