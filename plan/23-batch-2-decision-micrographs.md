# 23 — Batch 2: Decision Micrographs (21 types)

> **EXPANDED 2026-07-08 (96 → 100, plan/21 header):** +§21 IconArray (spec at the end of this doc; provenance plan/12 §catalog-expansion). Counts below updated 20 → 21. IconArray is geometry-simple — schedule it with the strip wave (PRs 1–4).

> Batch 2 spec · 2026-07-08 · template/checklist in [plan/21](21-full-catalog-buildout.md) (§4 template, §3 variant policy, §5 registration checklist, §8 standing rules — referenced, not restated here).
> Source catalog: [plan/16](16-decision-micrographs.md). Its system rules bind every spec below: designed degradation order, frequency-beats-probability, uncertainty display is honesty not decoration.

## Overview

- **21 components**, all in `@microcharts/react`, `collection: "decision"` in the catalog registry. Each is one PR-sized unit per plan/21 §5; each PR updates STATUS.md's Batch 2 line.
- **Shared infra:** everything statistical comes from the Batch-0 kernel — `core/quantile.ts` (7 consumers here), `core/bin.ts` (shift-histogram), `core/stack.ts` (net-flow), `core/jitter.ts` (unused — ghost selection is quantile-deterministic, see §20). The only new algorithm in this batch is change-point's two-segment mean-shift detector, which lives in `src/charts/change-point/geometry.ts` per plan/21 §6.0.C — it is a documented heuristic, not statistics.
- **PR order = the numbered order below**, simple → complex: presence/band/tick strips first (1–4), composed line charts (5–11), distribution pairs (12–14), ranked/structured forms (15–17), then the three algorithm-bearing types (18–20).
- **Gate to Batch 3** (plan/21 §7): full DoD ×21 (plan/09 §5) **plus research-claim audit entries in plan/12** — every research number cited in a spec below gets a provenance row; the two flagged gaps in §Batch-level risks are mandatory entries.
- All summary templates route through `SummaryStrings` (no hardcoded English outside `EN`); every example sentence below is the exact string a docs-as-tests assertion will pin.
- All geometry: pure, React-free, 2-dp rounded at generation, integer viewBox, ES2022 floor, `makeFormatter` only.
- Interactive entries compose the static component (canon) — overlays as children, one pointer listener, roving keyboard, polite live region.

---

### 1. CoverageStrip — `coverage-strip`
**Collection:** decision · **Data shape:** S1 with first-class gaps — `data: readonly (number | null)[]` (`null` = *no measurement*; `0` = *measured zero* — the distinction is the chart) · **Source:** plan/16 §Q13
**Question it answers:** Can I trust this data — where was nothing measured?
**Primary encoding:** presence/absence as cell fill on a time strip · **Precision:** high (binary read per slot; `mode="intensity"` degrades to medium — docs steer to HeatStrip when *values*, not presence, are the story)
**Default render:** viewBox `80×10`. Z-order: (1) measured cells — filled rects, low-opacity accent; (2) gap cells — hollow rects with hairline stroke (fill `none`), visually distinct by *shape treatment*, never by lightness alone (survives forced-colors); (3) optional coverage label. 1 node/cell, documented cap 120 slots (beyond: caller pre-buckets; docs recipe). Labels: none by default; `label="percent"` reserves a right gutter of `maxFormattedLength` ch (plan/18). Tokens: `--mc-accent` for measured, `--mc-muted` hairline for gaps; `data-mc-ink="cell"` / `data-mc-ink="gap"`.
**Props beyond shared grammar:**
- `expected?: number` — default `data.length` — total slots the window *should* contain; lets trailing missingness count (an array that simply stops is the worst gap of all).
- `mode?: "binary" | "intensity"` — default `"binary"` — intensity shades measured cells by value (how much, not just whether) while gaps stay hollow.
- `shape?: "square" | "round"` — default `"square"` — shared variant vocabulary (plan/21 §3); round for friendlier product contexts.
**Variants (4):** `mode="intensity"` → presence *and* magnitude in one strip · `label="percent"` → coverage number stated in-chart for KPI contexts · `shape="round"` → product-surface tone · `expected` → trailing-gap honesty for live windows.
**Geometry (`geometry.ts`):**
```ts
coverageGeometry(opts: { width: number; height: number; data: readonly (number | null)[];
  expected?: number; pad?: number }): {
  cells: { x: number; width: number; y: number; height: number; present: boolean; value: number | null }[];
  coverage: number;            // measured / expected, 0–1, 2-dp
  longestGap: number;          // slots, includes trailing shortfall vs expected
}
```
**New core needs:** none.
**Interactive entry:** grid lookup (pointer x → slot index, pure division). Keyboard: `tabIndex=0` wrapper, ←/→ step slots, Home/End. Live region: `"Slot 14: no measurement."` / `"Slot 14: 3.2."` Hover ring overlay passed as children to the static component.
**Summary (`coverageSummary`):** template `{measured} of {expected} slots measured ({coverage}); longest gap {gap} slots.` → **"18 of 24 slots measured (75%); longest gap 4 slots."**
**Edge cases beyond the shared matrix:** all-`null` → 0% coverage, all-hollow strip (renders, not an empty state) · `data.length > expected` → expected clamped up with dev warning · `NaN` value → treated as measured-but-unreadable: filled cell, value omitted from announce (a sensor that reported garbage still reported).
**Size budget:** static ≤ 1.5 kB / interactive ≤ 2.5 kB.
**Honesty notes:** absence ≠ zero — a gap must never render as a zero-height/zero-value cell, and no variant may interpolate across gaps. Gap treatment is shape-based (hollow + hairline) so the distinction survives forced-colors and print.
**Docs page:** Playground knobs: mode, shape, expected, label, data presets (trailing gap / interior gap / sparse) · 4-context angle: table cell beside a metric ("trust the number to its left") · why-this-default: binary presence, because the first question about data is *whether*, not *how much*.

---

### 2. BenchmarkStrip — `benchmark-strip`
**Collection:** decision · **Data shape:** structured — `data: readonly number[]` (peer values) + `value: number` (focal) · **Source:** plan/16 §Q5
**Question it answers:** Is this value normal for its peer group?
**Primary encoding:** position on a common scale against an empirical band · **Precision:** high
**Default render:** viewBox `80×12`. Z-order: (1) p5–95 band, faintest; (2) p25–75 band nested, stronger; (3) median hairline tick; (4) focal dot, accent; (5) percentile label. ≤ 6 nodes. Label: `label="percentile"` default — mono `p68` anchored `text-anchor="end"` in a 4-ch right gutter (plan/18). Tokens: band opacities off `--mc-fg`, dot `--mc-accent`; `data-mc-ink="band" | "data" | "label"`.
**Props beyond shared grammar:**
- `value: number` — required — the focal reading (same meaning as Bullet's `value`).
- `range?: "p5p95" | "minmax"` — default `"p5p95"` — outer band choice; `minmax` states the full observed field when n is small and tail quantiles would be fiction.
- `median?: boolean` — default `true` — the center tick anchors the read.
**Variants (4):** `label="value" | "percentile" | "none"` → what the gutter states · `range="minmax"` → small-n honesty · `median={false}` → quietest form for dense tables · `positive` → colors the focal dot by which side of the band is good (latency vs revenue).
**Geometry (`geometry.ts`):**
```ts
benchmarkStripGeometry(opts: { width: number; height: number; data: readonly number[];
  value: number; range?: "p5p95" | "minmax"; domain?: readonly [number, number]; pad?: number }): {
  outer: { x: number; width: number };     // p5–95 or min–max
  inner: { x: number; width: number };     // p25–75
  median: { x: number; value: number };
  dot: { x: number; clamped: -1 | 0 | 1 }; // clamped ≠ 0 ⇒ value beyond the strip
  percentile: number;                       // empirical, 0–100, integer
}
```
Percentile rule (documented, tested): `100 · (below + 0.5 · ties) / n`, rounded — mid-rank, so ties don't bias.
**New core needs:** `quantile.quantiles` (Batch 0).
**Interactive entry:** pointer x → nearest quantile edge (p5/p25/p50/p75/p95) announced with its value: `"p75: 420 ms."` Focus announces the full name; ←/→ step edges. Crosshair tick overlay as children.
**Summary (`benchmarkSummary`):** template `{value} — {percentile} percentile of {n} peers (middle half {p25}–{p75}).` → **"312 ms — 68th percentile of 42 peers (middle half 250–420 ms)."**
**Edge cases beyond the shared matrix:** `n < 8` peers → tail quantiles unreliable: auto-falls back to `range="minmax"` and the summary says "of 5 peers" so smallness is audible · focal outside the outer band → dot clamped to the pad edge with an outward-pointing tick, `percentile` reported as the true 0/100-adjacent number · all peers equal → bands collapse to one tick; summary states "all peers at {v}".
**Size budget:** static ≤ 1.5 kB / interactive ≤ 2.5 kB.
**Honesty notes:** bands are *empirical* quantiles of the supplied peers, never a fitted distribution; the stated percentile uses the documented mid-rank rule; no axis — the band *is* the reference frame. **Audit flag:** plan/16 groups this with "strongest research" but cites no study for the band+dot+percentile form itself — plan/12 entry required (see batch risks).
**Docs page:** Playground knobs: n-peers preset, value slider, range, label, positive · 4-context angle: table cell (a column of BenchmarkStrips under `SparkGroup` is the flagship recipe) · why-this-default: p5–95 outer because "normal" is a range, not a min/max anecdote.

---

### 3. PercentileLadder — `percentile-ladder`
**Collection:** decision · **Data shape:** S1 — `data: readonly number[]` (raw sample; component derives quantiles) · **Source:** plan/16 §Q15
**Question it answers:** What does the tail look like — not just the median?
**Primary encoding:** tick position on a zero-anchored strip · **Precision:** high
**Default render:** viewBox `80×12`. Z-order: (1) hairline track from 0 to domain max; (2) ticks at p50/p90/p99 with graduated emphasis — p99 strongest (the tail is the point); (3) mono micro-labels `50 90 99` beneath each tick, `text-anchor="middle"` (plan/18 anchor-only; below a documented 56 px width the labels drop first per the degradation order). ≤ 8 nodes. Tokens: ticks `--mc-fg` at stepped opacity, p99 `--mc-accent`; `data-mc-ink="data" | "label"`.
**Props beyond shared grammar:**
- `ps?: readonly number[]` — default `[50, 90, 99]` — 2–4 percentiles (hard cap 4; more ticks stop being a ladder).
- `scale?: "linear" | "log"` — default `"linear"` — log for long latency tails; **when log, a mono `log` tag renders in-chart** so the transform is never silent.
**Variants (4):** `ps` → e.g. `[50, 95, 99.9]` for stricter SLOs · `scale="log"` → tail compression made explicit · `label="values" | "ps" | "both" | "none"` → what the ticks say · `dots` → dot marks instead of ticks where the strip sits over text.
**Geometry (`geometry.ts`):**
```ts
percentileLadderGeometry(opts: { width: number; height: number; data: readonly number[];
  ps?: readonly number[]; scale?: "linear" | "log"; domain?: readonly [number, number]; pad?: number }): {
  track: { x0: number; x1: number; y: number };
  ticks: { p: number; value: number; x: number; emphasis: number }[]; // emphasis 0..k, tail highest
  ratio: number; // ticks.at(-1).value / ticks[0].value, 2-dp (Infinity-safe)
}
```
Quantile interpolation: linear (type-7), stated in docs.
**New core needs:** `quantile.quantiles` (Batch 0).
**Interactive entry:** pointer x → nearest tick; ←/→ step ticks. Live region: `"p99: 2.1 s — 17× the median."` Probe line overlay as children.
**Summary (`ladderSummary`):** template `p{p0} {v0}, p{p1} {v1}, p{p2} {v2} — the slowest {tailShare} take {ratio}× the median.` → **"p50 120 ms, p90 480 ms, p99 2.1 s — the slowest 1% take 17× the median."**
**Edge cases beyond the shared matrix:** coincident ticks (all-equal or heavy ties) → deduped to one rendered tick, summary states "all percentiles equal at {v}" · `scale="log"` with any value ≤ 0 → falls back to linear with dev warning (documented) · `ps` unsorted → sorted ascending internally (spread + `sort`, ES2022 floor — **not** `toSorted`).
**Size budget:** static ≤ 1.5 kB / interactive ≤ 2.5 kB.
**Honesty notes:** zero-anchored track — tick *distances* carry the story, so the origin is never cropped; log scale never applied silently (in-chart tag); ticks are point estimates — docs steer to QuantileDots when the question is odds rather than tail shape.
**Docs page:** Playground knobs: ps, scale, label, latency/payment-size data presets · 4-context angle: sentence ("p99 latency ▔▎▎ 2.1 s") and table cell per endpoint · why-this-default: p50/p90/p99, because the median never tells the latency story alone.

---

### 4. GradedBand — `graded-band`
**Collection:** decision · **Data shape:** S1 — `data: readonly number[]` (sample/posterior draws for one estimate; component derives nested intervals) · **Source:** plan/16 §Q3
**Question it answers:** How sure are we about this one number?
**Primary encoding:** nested interval extent, graded by opacity · **Precision:** medium (interval read; docs steer to QuantileDots when a countable probability is needed)
**Default render:** viewBox `80×12`. Z-order: (1) 95% band, faintest; (2) 80% nested; (3) 50% strongest; (4) median tick; (5) optional observed-value dot. ≤ 6 nodes. Opacity steps are tokens (`--mc-band-1..3`), never a false hard edge — the outermost band already sits at low opacity so its boundary reads as a fade, not a cliff. No labels by default; `label="median"` uses a right ch-gutter. `data-mc-ink="band" | "data"`.
**Props beyond shared grammar:**
- `levels?: readonly number[]` — default `[50, 80, 95]` — 1–3 nested central intervals (hard cap 3; more levels destroy the graded read).
- `value?: number` — observed/point value overlaid as a dot, distinct shape from the median tick (never color-alone).
- `softEdge?: boolean` — default `false` — gradient fade past the outermost band instead of a cut (the plan/21 §2 fading-edge variant-type lands here).
**Variants (4):** `levels={[50, 90]}` → two-level minimal form for the tightest cells · `softEdge` → "this is approximate" without any edge at all · `value` → estimate-vs-actual in one strip · `label="median"` → KPI-card form.
**Geometry (`geometry.ts`):**
```ts
gradedBandGeometry(opts: { width: number; height: number; data: readonly number[];
  levels?: readonly number[]; domain?: readonly [number, number]; pad?: number }): {
  bands: { p: number; x: number; width: number; step: number }[]; // widest first (z-order)
  median: { x: number; value: number };
  dot: { x: number } | null;
}
```
Nesting invariant enforced: each inner interval is clipped to its outer (quantile ties can otherwise invert by rounding); property test asserts `bands[i]` contains `bands[i+1]`.
**New core needs:** `quantile.quantiles` (Batch 0).
**Interactive entry:** ←/→ step levels outward/inward from the median; pointer x snaps to nearest band edge. Live region: `"80% interval: 17 to 26."` Focus ring + edge tick overlays as children.
**Summary (`gradedBandSummary`):** template `Median {m}; 50% within {a}–{b}, 95% within {c}–{d}.` → **"Median 21; 50% within 17–26, 95% within 9–38."**
**Edge cases beyond the shared matrix:** single draw / all-equal → all bands zero-width: render the median tick only, summary states the point value with no interval claim · `levels` with one entry → single band + tick (legal minimal form) · non-nesting input after rounding → clipped, never swapped.
**Size budget:** static ≤ 1.5 kB / interactive ≤ 2.5 kB.
**Honesty notes:** this form exists because bar-plus-error-bar induces within-the-bar bias (Correll & Gleicher 2014, cited in plan/16) — therefore GradedBand must **never** be rendered as a bar from zero, and no variant may add one. Opacity grading maps to probability level and nothing else.
**Docs page:** Playground knobs: levels, softEdge, value, sample-size preset · 4-context angle: KPI card (forecast number + its honesty underneath) · why-this-default: three nested levels, because a single interval invites edge-literalism.

---

### 5. RateVolume — `rate-volume`
**Collection:** decision · **Data shape:** structured — `data: readonly { rate: number; volume: number }[]` · **Source:** plan/16 §Q16
**Question it answers:** The rate moved — on what volume?
**Primary encoding:** line position (rate) with denominator context bars · **Precision:** high for rate, low-deliberate for volume (ghost bars are context, not a second precise series — docs steer to a paired SparkBar when volume itself needs reading)
**Default render:** viewBox `80×20`. Z-order: (1) ghost volume bars — zero-anchored, own scale, low opacity, `shape-rendering: crispEdges`; (2) rate line; (3) low-volume rate dots rendered *hollow* (shape cue, not color) where `volume < minVolume`; (4) `label="last"` rate endpoint in a ch-gutter. Node budget: 1/bar + ≤ 5, documented cap 60 periods. Tokens: bars `--mc-muted`, line `--mc-accent`; `data-mc-ink="ghost" | "data" | "label"`.
**Props beyond shared grammar:**
- `minVolume?: number` — default `undefined` (cue off) — below it, rate marks render hollow: "insufficient denominator" made visible at the mark itself.
- `volumeFormat?: Intl.NumberFormatOptions | ((n: number) => string)` — volume has different units than rate; both formatters cached via `makeFormatter`.
**Variants (3):** `minVolume` → the guardrail cue · `curve="linear" | "step"` → step when rates are per-period aggregates · `dots="auto" | "none"` → endpoint emphasis in dense tables.
**Geometry (`geometry.ts`):**
```ts
rateVolumeGeometry(opts: { width: number; height: number; data: readonly { rate: number; volume: number }[];
  domain?: readonly [number, number]; volumeDomain?: readonly [number, number];
  minVolume?: number; pad?: number }): {
  bars: { x: number; y: number; width: number; height: number }[];  // zero-anchored
  line: { d: string };
  points: { x: number; y: number; low: boolean }[];
  last: { x: number; y: number; rate: number; volume: number };
}
```
**New core needs:** none (scale + path from kernel).
**Interactive entry:** nearest-x. Live region **always pairs both numbers**: `"March: 4.1% on 38 events (low volume)."` ←/→ step periods; crosshair + bar highlight overlays as children.
**Summary (`rateVolumeSummary`):** template `{rateLast} on {volumeLast} {unit}{lowFlag}; {trend} from {rateFirst} across {n} periods.` → **"4.1% on 38 events (low volume); up from 2.3% across 12 weeks."**
**Edge cases beyond the shared matrix:** `volume === 0` → rate is undefined regardless of input: line gap + zero-height bar, announced as "no events" (never plot a rate nobody generated) · `rate` null/NaN with volume present → gap in line, bar still drawn · all volumes equal → bars render flat (correct, not a bug).
**Size budget:** static ≤ 2.5 kB / interactive ≤ 3.5 kB.
**Honesty notes:** the ghost bars are the chart's reason to exist — there is deliberately **no prop to remove them**; a rate without its denominator is the lie this type prevents. Summary and live region never state a rate without its volume.
**Docs page:** Playground knobs: minVolume, curve, conversion/error-rate presets (including the "100% jump on 3 events" demo) · 4-context angle: KPI card (rate headline, honest bars underneath) · why-this-default: bars muted and unlabeled, because they answer "enough?", not "how many?".

---

### 6. NetFlow — `net-flow`
**Collection:** decision · **Data shape:** structured — `data: readonly { in: number; out: number }[]` (both ≥ 0, per period) · **Source:** plan/16 §Q14
**Question it answers:** In versus out — and where does that leave us net?
**Primary encoding:** mirrored area extent around a zero baseline + net line position · **Precision:** medium (area read; the net line restores high precision for the decision value)
**Default render:** viewBox `80×20`. Z-order: (1) zero baseline hairline; (2) inflow area above zero (`--mc-pos`, low opacity); (3) outflow area mirrored below (`--mc-neg`, same opacity, same scale); (4) net line on top (`--mc-fg`); (5) `label="last"` signed net value in a ch-gutter (the sign in text, so direction is never color-alone). ≤ 6 nodes. `data-mc-ink="area" | "data" | "label"`.
**Props beyond shared grammar:**
- `net?: boolean` — default `true` — the net line; areas alone answer "how much traffic", the line answers "which way".
**Variants (3):** `mode="area" | "bars"` — bars for few discrete periods (≤ 12): mirrored columns read as countable months · `net={false}` → gross-flows-only form · `positive="down"` → contexts where outflow is the goal (debt paydown).
**Geometry (`geometry.ts`):**
```ts
netFlowGeometry(opts: { width: number; height: number; data: readonly { in: number; out: number }[];
  mode?: "area" | "bars"; domain?: readonly [number, number]; pad?: number }): {
  zeroY: number;
  inArea: { d: string };   // or inBars/outBars rects in mode="bars"
  outArea: { d: string };
  netLine: { d: string };
  last: { x: number; y: number; net: number };
}
```
One shared linear scale for both directions — `domain` (if given) is the symmetric magnitude bound.
**New core needs:** `stack.ts` zero-anchored helpers (Batch 0).
**Interactive entry:** nearest-x. Live region: `"Week 6: in 4.2k, out 3.1k, net +1.1k."` ←/→ step periods; crosshair + in/out value ticks as children.
**Summary (`netFlowSummary`):** template `Net {netLast} last period; in {in} vs out {out}; net positive {k} of {n} periods.` → **"Net +1.1k last period; in 4.2k vs out 3.1k; net positive 9 of 12 periods."**
**Edge cases beyond the shared matrix:** negative `in`/`out` input → invalid (flows are magnitudes): treated as 0 with dev warning, documented · all-zero periods → baseline only, summary "no flow across 12 periods" · single period → `mode="bars"` render regardless of prop (an area of one point is a lie about continuity).
**Size budget:** static ≤ 2 kB / interactive ≤ 3 kB.
**Honesty notes:** both directions share one scale — never independently scaled to balance the picture; areas anchor at zero both ways (non-negotiable for areas); the net line is computed `in − out`, never smoothed.
**Docs page:** Playground knobs: mode, net, positive, cash-flow/user-flow presets · 4-context angle: table cell (cash flow per account row) · why-this-default: mirrored areas + net line, because gross and net answer different questions and the cell must answer both.

---

### 7. RetentionCurve — `retention-curve`
**Collection:** decision · **Data shape:** S1 — `data: readonly number[]` (fraction retained per period; period 0 typically 1.0) · **Source:** plan/16 §Q12
**Question it answers:** Do they stay — and does the curve plateau?
**Primary encoding:** line position on a full-range fixed scale · **Precision:** high
**Default render:** viewBox `80×20`. Z-order: (1) optional benchmark ghost — dashed, muted, behind; (2) retention step-line (`curve="step"` default: cohort periods are discrete); (3) plateau marker — dotted horizontal at plateau level when detected; (4) `label="last"` final retention % in a ch-gutter. ≤ 6 nodes. **Y domain locked to `[0, 1]` by default** — the full range is the honest frame for a share; `domain` can override but the docs state why you shouldn't. Tokens: line `--mc-accent`, ghost `--mc-muted`; `data-mc-ink="ghost" | "data" | "label"`.
**Props beyond shared grammar:**
- `benchmark?: readonly number[]` — peer/industry curve rendered as the ghost; visually subordinate by construction (dashed + muted, not configurable to compete).
- `plateau?: boolean` — default `true` — detect-and-mark: plateau when mean |Δ| over the last `max(3, ⌈n/3⌉)` periods < 0.005 (0.5 pts/period); criterion documented and tested.
**Variants (4):** `benchmark` → "good for our category?" in one glance · `curve="smooth"` → editorial contexts (docs note: step is the honest default for cohort data) · `plateau={false}` → raw curve only · `label="last" | "none"`.
**Geometry (`geometry.ts`):**
```ts
retentionGeometry(opts: { width: number; height: number; data: readonly number[];
  benchmark?: readonly number[]; curve?: "step" | "smooth"; domain?: readonly [number, number]; pad?: number }): {
  line: { d: string };
  ghost: { d: string } | null;
  last: { x: number; y: number; value: number };
  plateau: { y: number; value: number; from: number } | null; // from = first plateau period
}
```
**New core needs:** none.
**Interactive entry:** nearest-x. Live region: `"Month 3: 41% retained (benchmark 37%)."` ←/→ step periods; crosshair + ghost-value tick as children.
**Summary (`retentionSummary`):** template `{last} retained after {n} {unit}; curve plateaus from {unit} {from}.` (plateau clause omitted when none) → **"34% retained after 8 weeks; curve plateaus from week 5."**
**Edge cases beyond the shared matrix:** any value > 1 → the whole series is treated as 0–100 percent input (deterministic rule: `max > 1.001` ⇒ divide by 100; mixed-unit input gets a dev warning) · non-monotone bumps (resurrection) → rendered as-is, never sorted or smoothed away · benchmark shorter/longer than data → drawn to its own length on the shared x scale.
**Size budget:** static ≤ 2 kB / interactive ≤ 3 kB.
**Honesty notes:** full `[0,1]` domain by default — truncating the floor manufactures drama in either direction; the plateau marker appears only when the documented criterion holds (never as decoration); the benchmark is a ghost and stays one.
**Docs page:** Playground knobs: benchmark on/off, curve, plateau, healthy/leaky cohort presets · 4-context angle: KPI card per cohort; tab header ("W12 cohort ⌐ 34%") · why-this-default: step + full range, because retention is a discrete share, not a continuous signal.

---

### 8. BurnChart — `burn-chart`
**Collection:** decision · **Data shape:** structured — `data: { plan: readonly number[]; actual: readonly number[] }` (remaining work per period for `mode="down"`, completed for `"up"`) · **Source:** plan/16 §Q11
**Question it answers:** Will we finish on time?
**Primary encoding:** line position vs the plan line, plus projected landing gap · **Precision:** high for history, low-deliberate for projection (dotted, provisional by construction)
**Default render:** viewBox `80×20`. Z-order: (1) plan line — dashed, muted, full length (deadline = `plan.length − 1`); (2) actual line — solid, to today; (3) today tick — vertical hairline at `actual.length − 1`; (4) projection — dotted from last actual to the deadline x, slope = linear fit over the last `max(2, ⌈actual.length/3⌉)` actual points (k documented); (5) `label="gap"` — signed landing delta vs plan at deadline (e.g. `+3 d` or `−6 pts`) in a ch-gutter. ≤ 7 nodes. Y zero-anchored. Tokens: plan `--mc-muted`, actual `--mc-accent`, projection `--mc-fg` dotted; `data-mc-ink="ghost" | "data" | "label"`.
**Props beyond shared grammar:**
- `mode?: "down" | "up"` — default `"down"` — burn-down (remaining → 0) vs burn-up (done → scope); changes the polarity of "ahead".
- `projection?: boolean` — default `true` — the dotted extrapolation; off for retrospectives.
**Variants (4):** `mode="up"` → scope-change contexts (rising scope visible in the plan line) · `projection={false}` → plan-vs-actual record only · `label="gap" | "none"` · `positive` → inherited polarity for the gap label color (down-is-good is automatic in `mode="down"`).
**Geometry (`geometry.ts`):**
```ts
burnGeometry(opts: { width: number; height: number; plan: readonly number[]; actual: readonly number[];
  mode?: "down" | "up"; projection?: boolean; domain?: readonly [number, number]; pad?: number }): {
  plan: { d: string };
  actual: { d: string };
  today: { x: number };
  projection: { d: string } | null;
  landing: { x: number; y: number; value: number; delta: number } | null; // delta vs plan end, signed
}
```
**New core needs:** none.
**Interactive entry:** nearest-x across both lines. Live region: `"Day 12: 34 points remain, plan 28 — 6 behind."` In the projection region: `"Day 18 (projected): 9 points remain."` ←/→ step days; Home/End jump start/deadline.
**Summary (`burnSummary`):** template `{elapsed} of {total} {unit} in: {actualNow} vs {planNow} planned — projected to finish {landing}.` → **"12 of 20 days in: 34 points remain vs 28 planned — projected to finish 3 days late."**
**Edge cases beyond the shared matrix:** actual longer than plan (overrun) → x domain extends past deadline; today tick beyond the plan's end is itself the message · flat/positive recent slope in `mode="down"` → projection never reaches zero: no landing point, summary states "not finishing at the current pace" · `plan` empty → actual-only line, projection off, no gap label.
**Size budget:** static ≤ 2 kB / interactive ≤ 3 kB.
**Honesty notes:** projection is dotted, muted, and its method (linear fit on the last k points, k stated) is documented — never a smoothed or optimistic curve; actuals are never smoothed; the plan line is data, not decoration, and re-baselining must come from the caller as new data.
**Docs page:** Playground knobs: mode, projection, on-track/behind/flatlined presets · 4-context angle: tab header per sprint; KPI card · why-this-default: the gap label, because "will we finish" is a number, not a vibe.

---

### 9. ErrorBudget — `error-budget`
**Collection:** decision · **Data shape:** S1 — `data: readonly number[]` (budget **remaining** as fraction 0–1 per elapsed step of the SLO window; index 0 = window start at 1.0) · **Source:** plan/16 §Q10
**Question it answers:** Are we burning the error budget too fast to survive the window?
**Primary encoding:** line position vs the steady-burn diagonal · **Precision:** high
**Default render:** viewBox `80×20`. X = window elapsed 0→1, Y = budget remaining 1→0. Z-order: (1) burn-rate reference wedges below the diagonal for rates `[1, 6, 14.4]` — each rate r is the straight line from (0,1) with slope −r, clipped to the plot; regions between successive rate lines get stepped faint tint (region ink, not data ink); (2) steady-burn diagonal (0,1)→(1,0), hairline; (3) actual remaining line, solid accent; (4) exhaustion mark if the line hits 0 before x=1; (5) `label="remaining"` current % left, ch-gutter. ≤ 8 nodes. `data-mc-ink="region" | "ghost" | "data" | "label"`.
**Props beyond shared grammar:**
- `rates?: readonly number[]` — default `[1, 6, 14.4]` — the Google-SRE multiwindow burn-rate alert conventions (fast-burn 14.4×, mid 6×, steady 1×); configurable because they are a *policy convention*, not physics.
**Variants (3):** `rates` → org-specific alert policy rendered truthfully · `label="remaining" | "none"` · `window`-free minimal form (wedges off via `rates={[1]}`: diagonal only, quietest cell form).
**Geometry (`geometry.ts`):**
```ts
errorBudgetGeometry(opts: { width: number; height: number; data: readonly number[];
  rates?: readonly number[]; pad?: number }): {
  diagonal: { x1: number; y1: number; x2: number; y2: number };
  wedges: { rate: number; d: string }[];          // background reference regions
  line: { d: string };
  remaining: { x: number; y: number; value: number };
  currentRate: number;                             // burn multiple over last k steps, 2-dp
  exhausted: { x: number; index: number } | null;
}
```
`currentRate` = observed slope over the last `max(2, ⌈n/6⌉)` steps ÷ steady slope.
**New core needs:** none.
**Interactive entry:** nearest-x. Live region: `"Day 12 of 30: 62% budget remaining, burning at 1.4× steady rate."` ←/→ step; End jumps to now.
**Summary (`errorBudgetSummary`):** template `{remaining} of error budget remains at {elapsed} of {total} — burning at {rate}× the steady rate.` → **"62% of error budget remains at day 12 of 30 — burning at 0.9× the steady rate."**
**Edge cases beyond the shared matrix:** budget increases mid-window (SLO re-baselined upstream) → rendered as-is with a doc note (the chart never edits history) · exhausted early → line clamps at 0 from the exhaustion index, ✕ tick at the crossing, summary becomes "budget exhausted at day 19 of 30" · `data` values outside [0,1] → clamped with dev warning.
**Size budget:** static ≤ 2 kB / interactive ≤ 3 kB.
**Honesty notes:** 1×/6×/14.4× are labeled in docs as the SRE-Workbook *convention* defaults, never as universal law; wedges are policy reference regions and render as background tint (never data-colored); `currentRate` derivation is documented (window k stated).
**Docs page:** Playground knobs: rates, healthy/fast-burn/exhausted presets · 4-context angle: KPI card per SLO; table cell in a service list · why-this-default: remaining-vs-diagonal, because "too fast" is only legible against the pace that exactly spends the window.

---

### 10. ControlStrip — `control-strip`
**Collection:** decision · **Data shape:** S1 — `data: readonly number[]` · **Source:** plan/16 §Q9
**Question it answers:** Is the process in control — or did something leave the band?
**Primary encoding:** point position vs control limits · **Precision:** high
**Default render:** viewBox `80×16`. Z-order: (1) control band (center ± 3σ̂), faint fill; (2) center hairline; (3) faint connecting line; (4) points — in-control points as bare vertices (no dots, `dots="out"` default), out-of-control points as ringed dots in `--mc-neg` (ring = shape cue, not color-alone); (5) no labels by default. Node budget: ≤ 6 + 1/violation, documented cap 100 points. σ̂ estimator (Shewhart individuals): **σ̂ = mean moving range / 1.128** — documented and property-tested; sample SD is *not* used (it inflates limits under drift). `data-mc-ink="band" | "data" | "flag"`.
**Props beyond shared grammar:**
- `limits?: "sigma" | "percentile"` — default `"sigma"` — `"percentile"` uses empirical p0.135/p99.865 (same coverage target) for skewed processes where ±3σ lies.
- `baseline?: number` — known process center from a reference period; otherwise center = mean of `data`.
- `rules?: "none" | "we"` — default `"none"` — Western Electric secondary rules; the implemented subset is exactly: WE-1 (1 beyond 3σ — always on), WE-2 (2 of 3 consecutive beyond 2σ same side), WE-4 (8 consecutive on one side of center). WE-3 (4-of-5 beyond 1σ) is excluded at micro scale — the flag density becomes noise; documented.
**Variants (4):** `limits="percentile"` → skew honesty · `rules="we"` → run/trend violations flagged with a secondary (hollow) marker · `baseline` → limits from a golden period, not the data under test · `dots="all"` → every point marked for sparse series.
**Geometry (`geometry.ts`):**
```ts
controlGeometry(opts: { width: number; height: number; data: readonly number[];
  limits?: "sigma" | "percentile"; baseline?: number; rules?: "none" | "we";
  domain?: readonly [number, number]; pad?: number }): {
  center: { y: number; value: number };
  band: { y: number; height: number; lo: number; hi: number };
  line: { d: string };
  points: { x: number; y: number; out: boolean }[];
  violations: { index: number; rule: "we1" | "we2" | "we4" }[];
  reliable: boolean;   // false when n < 10 — limits provisional
}
```
**New core needs:** `quantile.quantiles` for `limits="percentile"` (Batch 0).
**Interactive entry:** nearest-x. Live region: `"Point 14: 82.1 — above the upper limit (79.4)."`; violation points are additional keyboard stops (Tab cycles violations, ←/→ steps all points). Crosshair + limit-value ticks as children.
**Summary (`controlSummary`):** template `{k} of {n} points outside control limits (center {c}, limits {lo}–{hi}).` → **"2 of 30 points outside control limits (center 74.2, limits 69.0–79.4)."** In-control: "All 30 points within control limits …".
**Edge cases beyond the shared matrix:** `n < 10` → `reliable: false`: band renders dashed and the summary appends "limits provisional (n=6)" · zero variance (MR̄ = 0) → band collapses to the center hairline, no violations flaggable, documented · strongly trending data → limits assume stationarity; docs steer to ChangePoint (this is a doc note, not detection).
**Size budget:** static ≤ 2 kB / interactive ≤ 3 kB.
**Honesty notes:** the estimator is stated (MR̄/1.128), never a vague "±3 sigma"; percentile limits state their exact quantiles; WE rules are conventions and the implemented subset is enumerated — no rule fires silently.
**Docs page:** Playground knobs: limits, rules, baseline, in-control/shifted/trending presets · 4-context angle: table cell per production line/metric · why-this-default: flag only out-of-band points, because an in-control process should look boring.

---

### 11. ForecastCone — `forecast-cone`
**Collection:** decision · **Data shape:** structured — `data: readonly number[]` (history) + `forecast: { mid: readonly number[]; p80: readonly [number, number][]; p50?: readonly [number, number][] }` · **Source:** plan/16 §Q1
**Question it answers:** Will we land where we need to?
**Primary encoding:** band extent widening over the horizon · **Precision:** medium (band read; the widening itself is the message)
**Default render:** viewBox `80×20`. Z-order: (1) p80 band, faintest; (2) p50 band nested (when given); (3) history line, solid; (4) boundary tick at last actual (today); (5) mid path, **dashed** (an estimate never renders as fact); (6) optional `target` hairline; (7) `label="landing"` mid endpoint value, ch-gutter. ≤ 8 nodes. **Hard cap 2 bands** (50/80) — a 95% band at micro scale reads as false tail confidence and clutter. Tokens: bands `--mc-band-*`, history `--mc-fg`, mid `--mc-accent` dashed; `data-mc-ink="band" | "data" | "ghost" | "label"`.
**Props beyond shared grammar:**
- `forecast: {...}` — required — no forecast means this is a Sparkline (docs steer); band arrays are `[lo, hi]` pairs aligned to `mid`.
- `target?: number` — the landing reference; the question is "will we land", so the line the cone must clear is first-class.
**Variants (4):** p50 band omitted → single-band tightest form · `target` → band-vs-target read (summary gains a clearance clause) · `softEdge` on the outer band (shared vocabulary with GradedBand) · `curve` for history line.
**Geometry (`geometry.ts`):**
```ts
forecastConeGeometry(opts: { width: number; height: number; data: readonly number[];
  forecast: { mid: readonly number[]; p80: readonly [number, number][]; p50?: readonly [number, number][] };
  target?: number; domain?: readonly [number, number]; pad?: number }): {
  history: { d: string };
  boundary: { x: number };
  mid: { d: string };
  bands: { p: 50 | 80; d: string }[];   // closed area paths
  landing: { x: number; y: number; value: number };
  widening: boolean;                     // false ⇒ input cone fails to widen (see honesty)
}
```
`widening` check: band width at horizon end ≥ width at horizon start − ε (ε = 2% of domain).
**New core needs:** none.
**Interactive entry:** nearest-x, region-aware. History: `"Week 9: 38."` Forecast: `"Week 14 (forecast): median 42, 80% between 33 and 55."` ←/→ step; Tab jumps history-end / horizon-end.
**Summary (`forecastSummary`):** template `Median forecast {mid} by {h} (80% between {lo} and {hi}), from {now} today.` + optional `; the 80% band {clears | straddles | misses} the {target} target.` → **"Median forecast 42 by week 14 (80% between 33 and 55), from 38 today."**
**Edge cases beyond the shared matrix:** non-widening cone → **rendered exactly as given** (never auto-inflated), `widening: false`, dev warning, and docs name this as an input-honesty failure — a cone that doesn't widen misrepresents confidence decay · band pair with `hi < lo` → swapped with dev warning · empty history → cone-only with boundary at x0 (legal: pure-forecast cell) · forecast of length 1 → landing dot + interval whisker, no cone.
**Size budget:** static ≤ 2.5 kB / interactive ≤ 3.5 kB.
**Honesty notes:** max 2 bands, mid always dashed, widening validated — the three rules exist because the fan chart's entire honesty is *visible confidence decay*; none is a style option.
**Docs page:** Playground knobs: bands 1/2, target, widening/narrowing/volatile presets · 4-context angle: KPI card ("will we hit Q4?") and sentence · why-this-default: 50/80 not 95, because micro-scale tails invite overreading.

---

### 12. QuantileDots — `quantile-dots`
**Collection:** decision · **Data shape:** S1 — `data: readonly number[]` (raw sample or posterior draws) · **Source:** plan/16 §Q2
**Question it answers:** What are the odds — in countable form?
**Primary encoding:** countable dot frequency past a threshold · **Precision:** high for the count read, medium for shape
**Default render:** viewBox `80×20`. Quantile dotplot: `count` dots (default 20) at equal-probability quantiles of `data`, binned into columns and stacked bottom-up (Wilkinson layout; binning + Kay/Fernandes rounding from `core/quantile`). Z-order: (1) dots — muted fill; (2) `threshold` vertical hairline when given; (3) dots past the threshold re-inked `--mc-accent` **and** given a stroke ring (never color-alone); (4) `label="count"` (default when `threshold` set): mono `4 in 20` in a ch-gutter. Node budget: 1/dot + 3, cap = `count` ≤ 25. `data-mc-ink="data" | "flag" | "label"`.
**Props beyond shared grammar:**
- `count?: number` — default `20` — number of quantile dots (docs recommend 15–20: countable in clusters at micro scale; see honesty notes for the 50-dot caveat).
- `threshold?: number` — the decision line; turns the plot from shape into odds.
- `side?: "above" | "below"` — default `"above"` — which side of the threshold is the event being counted.
**Variants (4):** `count={15}` → even faster subitized counting in tiny cells · `threshold` + `side` → the count-past-the-line read · `label="count" | "none"` · `shape="round"` only (dots are dots; no square variant — countability is the encoding).
**Geometry (`geometry.ts`):**
```ts
quantileDotsGeometry(opts: { width: number; height: number; data: readonly number[];
  count?: number; threshold?: number; side?: "above" | "below";
  domain?: readonly [number, number]; pad?: number }): {
  dots: { x: number; y: number; r: number; past: boolean }[];
  threshold: { x: number } | null;
  past: number;      // dots past the line
  count: number;
}
```
Dot radius derives from bin width and max stack height; floor radius 1.25 viewBox units (below that, docs state the 60 px minimum width for this type).
**New core needs:** `quantile.ts` dotplot binning (Batch 0 — Kay/Fernandes rounding named there).
**Interactive entry:** the probe: pointer x moves a live threshold line; count recomputes purely (dots past x). Live region (throttled to rest): `"6 in 20 chances above 15 min."` Keyboard: ←/→ move the probe one bin; Enter locks/announces; Esc returns to the prop threshold. Probe line + re-inked dots are overlay children re-using the same geometry.
**Summary (`quantileDotsSummary`):** with threshold: template `{past} in {count} chances {side} {threshold}.` → **"4 in 20 chances above 15 min."** Without: `Most likely {modeLo}–{modeHi}; range {min}–{max}.`
**Edge cases beyond the shared matrix:** all-equal sample → one column of `count` dots at the value (correct: certainty) · `count > data.length` → fine (quantiles interpolate; documented) · threshold beyond data range → count 0 or `count`, stated plainly · width < 60 px → dots hit floor radius; docs mark this the minimum context for the type.
**Size budget:** static ≤ 2 kB / interactive ≤ 3 kB.
**Honesty notes:** dots are equal-probability quantiles, **not raw observations** — every docs page states "each dot ≈ a 1-in-{count} chance"; summaries always use frequency framing (`4 in 20`), never bare percentages (plan/16 system rule 3). **Audit flag:** the studied design (Kay 2016 / Fernandes 2018, 97%-of-optimal result) used 50 dots; our 15–20 default is a countability judgment at micro scale, not a validated equivalence — plan/12 entry + open question below.
**Docs page:** Playground knobs: count, threshold slider (the hero interaction), side, bus-wait/deploy-duration presets · 4-context angle: sentence ("miss the SLA ⣿⣄ 4 in 20") · why-this-default: 20 dots, because odds you can count beat odds you must trust.

---

### 13. ABStrips — `ab-strips`
**Collection:** decision · **Data shape:** structured — `data: { a: readonly number[]; b: readonly number[] }` · **Source:** plan/16 §Q6
**Question it answers:** Did B beat A — and by more than the overlap?
**Primary encoding:** two graded quantile strips on one shared scale; the visible overlap is the answer · **Precision:** medium (interval read; delta label restores a precise number)
**Default render:** viewBox `80×20`. Two rows on **one shared x domain** (union of both samples). Each row: p5–95 band faint, p25–75 nested, median tick — the GradedBand render recipe at fixed levels (geometry reused via `core/quantile`, not by importing the other chart). Row A muted, row B accent. `label="delta"` default: signed median delta, ch-gutter, sign in text. Row tag letters `A`/`B` anchored `start` at 2-ch left gutter (plan/18 anchor-only). ≤ 10 nodes. `data-mc-ink="band" | "data" | "label"`.
**Props beyond shared grammar:**
- `labels?: readonly [string, string]` — default `["A", "B"]` — row identities for gutter tags + summaries.
**Variants (3):** `label="delta" | "medians" | "none"` → what the gutter states · `positive` → which direction of delta reads as good (colors the delta label) · `dots` → quantile-dot rows instead of bands (frequency framing; needs ≥ 28 px height, documented).
**Geometry (`geometry.ts`):**
```ts
abStripsGeometry(opts: { width: number; height: number; a: readonly number[]; b: readonly number[];
  domain?: readonly [number, number]; pad?: number }): {
  rows: { y: number; height: number; outer: { x: number; width: number };
          inner: { x: number; width: number }; median: { x: number; value: number } }[];
  deltaMedian: number;
  overlap: number;   // p25–75 interval overlap as a fraction of the smaller interval, 0–1, 2-dp
}
```
**New core needs:** `quantile.quantiles` (Batch 0).
**Interactive entry:** pointer y picks row, x snaps to nearest quantile edge; ↑/↓ switch rows, ←/→ step edges. Live region: `"B median 118 ms, 12 ms below A."` / edge reads `"B p75: 140 ms."`
**Summary (`abSummary`):** template `{bLabel} median {bMed} vs {aLabel} {aMed} ({delta}); middle halves overlap {overlap}.` → **"B median 118 ms vs A 130 ms (−9%); middle halves overlap 40%."**
**Edge cases beyond the shared matrix:** identical samples → overlap 100%, delta 0; summary ends "no clear difference" · disjoint middle halves → overlap 0%; summary ends "clearly separated" · one arm with n < 8 → that row falls back to min–max band (BenchmarkStrip's small-n rule) and the summary carries both n's.
**Size budget:** static ≤ 2 kB / interactive ≤ 3 kB.
**Honesty notes:** never renders bare mean bars — the distribution context is mandatory; the overlap number is always computed and always in the summary (overlap *is* the honest answer, per plan/16); the delta label never appears without the strips behind it.
**Docs page:** Playground knobs: labels, positive, dots, clear-win/overlapping/identical presets · 4-context angle: KPI card per experiment; table cell in an experiments list · why-this-default: overlap in the summary, because an average delta without spread is how A/B results lie.

---

### 14. ShiftHistogram — `shift-histogram`
**Collection:** decision · **Data shape:** structured — `data: { before: readonly number[]; after: readonly number[] }` · **Source:** plan/16 §Q7
**Question it answers:** Did the fix actually change the distribution?
**Primary encoding:** mirrored bin heights around a center line + median shift · **Precision:** medium (shape read; the shift label is the precise takeaway)
**Default render:** viewBox `80×20`. Shared bin edges over the union domain (`core/bin`, ≤ 12 bins). Z-order: (1) center hairline; (2) before-bins upward, muted; (3) after-bins downward, accent; (4) median ticks per side; (5) `label="shift"` signed Δmedian, ch-gutter; (6) side tags `before`/`after` anchored `start` (drop first under the degradation order). Node budget: 2/bin + 4, cap 12 bins. Heights are **per-side proportions** (each side's counts ÷ that side's n), then one shared height scale = max proportion across both sides — so unequal sample sizes cannot fake a shift. Rule documented + property-tested. `data-mc-ink="bar" | "data" | "label"`.
**Props beyond shared grammar:**
- `bins?: number` — default auto (Sturges capped at 12) — shared edges for both sides always.
- `labels?: readonly [string, string]` — default `["before", "after"]`.
**Variants (3):** `mode="mirror" | "overlay"` — overlay (after as outline over before fill, same baseline) when the shapes are similar and the mirror hides it · `bins` · `label="shift" | "medians" | "none"`.
**Geometry (`geometry.ts`):**
```ts
shiftHistogramGeometry(opts: { width: number; height: number; before: readonly number[]; after: readonly number[];
  bins?: number; mode?: "mirror" | "overlay"; domain?: readonly [number, number]; pad?: number }): {
  centerY: number;
  bins: { x: number; width: number; up: number; down: number }[];  // heights in viewBox units
  medians: { before: { x: number; value: number }; after: { x: number; value: number } };
  shift: number;   // after − before median, 2-dp
}
```
**New core needs:** `bin.ts` (Batch 0).
**Interactive entry:** grid lookup (pointer x → bin). Live region: `"10–12 ms: 18% before, 6% after."` ←/→ step bins; `M` jumps between the two median ticks.
**Summary (`shiftSummary`):** template `Median {direction} from {before} to {after} {suffix}.` → **"Median fell from 130 ms to 106 ms after the fix."**
**Edge cases beyond the shared matrix:** unequal n → proportions rule (above) makes it safe; summary carries both n's (`"on 6,400/7,100 samples"` clause) · one side empty → single histogram + summary "no {side} sample" (never fabricate a mirror) · a single outlier stretching the union domain → bins widen honestly; docs steer to the `domain` prop with an explicit note that clipping must be disclosed by the caller.
**Size budget:** static ≤ 2 kB / interactive ≤ 3 kB.
**Honesty notes:** shared bin edges and one shared height scale always — per-side normalization is the only allowed normalization and it is stated; mirror orientation carries *identity*, not valence (up ≠ good), which is why side tags exist; medians never smoothed or trimmed.
**Docs page:** Playground knobs: mode, bins, real-shift/no-shift/variance-only presets · 4-context angle: KPI card ("the fix, proven") · why-this-default: mirror, because before/after symmetry makes the shift a visible displacement.

---

### 15. ParetoStrip — `pareto-strip`
**Collection:** decision · **Data shape:** S2 — `data: readonly { label: string; value: number }[]` · **Source:** plan/16 §Q20
**Question it answers:** What should we fix first?
**Primary encoding:** descending bar magnitude + cumulative-share line on a fixed 0–100% scale · **Precision:** high
**Default render:** viewBox `80×20`. Component sorts descending by value (stable; input order breaks ties). Z-order: (1) bars — band scale, causes up to the threshold-crossing get `--mc-accent`, the rest muted; (2) cumulative line — **fixed 0–100% y scale spanning full plot height, never rescaled**; (3) threshold hairline at `threshold`% with the crossing point marked; (4) `label="count"`: mono `3 of 9 → 80%`, ch-gutter. Node budget: 1/bar + 4, cap 12 bars (rollup below). `data-mc-ink="bar" | "data" | "ghost" | "label"`.
**Props beyond shared grammar:**
- `threshold?: number` — default `80` — the cumulative reference line; explicitly configurable because 80% is a working reference, never a claimed law (docs copy rule).
- `max?: number` — default `8` — categories beyond `max` roll up into `Other`, which **always renders last** and never re-enters the rank order.
**Variants (3):** `threshold` value / `threshold={false}` off · `max` rollup depth · `label="count" | "none"`.
**Geometry (`geometry.ts`):**
```ts
paretoGeometry(opts: { width: number; height: number; data: readonly { label: string; value: number }[];
  threshold?: number | false; max?: number; pad?: number }): {
  bars: { x: number; width: number; y: number; height: number; label: string; share: number; cum: number; vital: boolean }[];
  line: { d: string };
  thresholdY: number | null;
  crossing: { index: number; x: number } | null;   // first bar whose cum ≥ threshold
  other: { count: number; share: number } | null;
}
```
Cumulative shares computed on the **full input total** (including rolled-up Other), so the line always ends at exactly 100.
**New core needs:** none (band scale from kernel).
**Interactive entry:** grid lookup (pointer x → bar). Live region: `"Timeouts: 34% of total, cumulative 61%."` ←/→ step bars; `T` jumps to the crossing bar.
**Summary (`paretoSummary`):** template `Top {k} of {n} {unit} account for {cum} of {total-noun}.` → **"Top 3 of 9 causes account for 82% of incidents."**
**Edge cases beyond the shared matrix:** negative values → invalid for a composition: excluded with dev warning (documented — a negative "cause count" is caller error, not a rendering choice) · zero total → bars empty, line undefined: renders the track + summary "no recorded {unit}" · `Other` larger than the top cause → rendered honestly at its size but **still last**; docs note this usually means `max` is too aggressive.
**Size budget:** static ≤ 2 kB / interactive ≤ 3 kB.
**Honesty notes:** the cumulative scale is fixed 0–100 and shares the full plot height — never rescaled to steepen the curve; 80% is a reference default and all docs copy says so; Other never participates in ranking (plan/16 rule verbatim).
**Docs page:** Playground knobs: threshold, max, incident-causes/support-tags presets · 4-context angle: KPI card ("fix these three") and tab header per queue · why-this-default: accent stops at the crossing, because the chart's one job is to say where to stop reading.

---

### 16. DataDiff — `data-diff`
**Collection:** decision · **Data shape:** structured — `data: readonly { key: string; added: number; removed: number }[]` (non-negative counts per key; docs recipe shows deriving from two snapshots) · **Source:** plan/16 §Q17
**Question it answers:** What changed between these two versions of the data?
**Primary encoding:** diverging bar length per key — removed left, added right · **Precision:** high
**Default render:** viewBox `80×20`. Z-order: (1) center hairline (zero); (2) per key: removed bar leftward `--mc-neg`, added bar rightward `--mc-pos` — both always drawn, symmetric shared scale = max(added, removed) across all rows; (3) optional net tick per row; (4) no key labels by default (host table rows carry keys; `labels` opts in, anchored `start`, drop-first under degradation). Node budget: 2/row + 2, cap 12 rows (docs recommend ≤ 8; min row height 3 units enforced). `data-mc-ink="bar" | "data" | "label"`.
**Props beyond shared grammar:**
- `labels?: boolean` — default `false` — in-chart key tags for standalone use.
- `net?: boolean` — default `false` — a tick at `added − removed` per row (a summary mark, never a replacement for the two bars).
- `sort?: "none" | "net" | "magnitude"` — default `"none"` — input order is often meaningful (schema order, alphabetical upstream).
**Variants (4):** `labels` · `net` · `sort` · `label="totals"` → column footer `+512 / −187` mono line.
**Geometry (`geometry.ts`):**
```ts
dataDiffGeometry(opts: { width: number; height: number;
  data: readonly { key: string; added: number; removed: number }[];
  sort?: "none" | "net" | "magnitude"; domain?: readonly [number, number]; pad?: number }): {
  centerX: number;
  rows: { key: string; y: number; height: number;
          added: { x: number; width: number }; removed: { x: number; width: number };
          net: number }[];
  totals: { added: number; removed: number };
}
```
**New core needs:** none.
**Interactive entry:** grid lookup (pointer y → row). Live region: `"users: +340 added, −120 removed, net +220."` ↑/↓ step rows; Home/End.
**Summary (`dataDiffSummary`):** template `+{added} added, −{removed} removed across {n} keys; largest change: {key} ({net}).` → **"+512 added, −187 removed across 6 keys; largest change: users (+340)."**
**Edge cases beyond the shared matrix:** negative counts → invalid, treated as 0 with dev warning (added/removed are magnitudes by definition) · a key with 0/0 → hairline placeholder tick so the key's presence stays visible (absence of change ≠ absence of the key) · > 12 rows → dev warning + docs steer to a table of DataDiffs (one per group) — the component never silently truncates.
**Size budget:** static ≤ 2 kB / interactive ≤ 3 kB.
**Honesty notes:** added and removed are never visually netted by default — both bars always render (a +500/−480 churn and a +20/−0 trickle must never look alike); one symmetric scale across all rows; cross-chart comparison goes through `SparkGroup` shared domain.
**Docs page:** Playground knobs: labels, net, sort, schema-migration/audience-churn presets · 4-context angle: table cell per dataset version; KPI card for a sync job · why-this-default: both directions always drawn, because net-only diffs hide churn.

---

### 17. QuadrantDot — `quadrant-dot`
**Collection:** decision · **Data shape:** structured — `data: { x: number; y: number }` (focal) + `field?: readonly { x: number; y: number }[]` (peers) · **Source:** plan/16 §Q18
**Question it answers:** Where does this item sit in the 2×2 — against the field?
**Primary encoding:** 2-D position vs quadrant split · **Precision:** medium (quadrant membership is the read; exact position is second-read)
**Default render:** viewBox `24×24` (glyph scale). Z-order: (1) faint tint on the focal point's quadrant (≤ 4% fill); (2) hairline cross at the split; (3) field ghost dots, tiny + muted; (4) focal dot, accent, larger. ≤ 5 nodes + 1/ghost, cap 30 ghosts. No in-chart text at glyph size — axis meaning lives in `title` + summary (documented pattern: `title="Effort vs impact"`). `data-mc-ink="region" | "ghost" | "data"`.
**Props beyond shared grammar:**
- `xDomain?: readonly [number, number]` — x-axis domain (shared `domain` stays the y-domain per grammar; a 2-D chart earns the extra prop).
- `split?: readonly [number, number]` — default domain midpoints — the quadrant boundary; never hidden (see honesty).
- `field?: readonly { x: number; y: number }[]` — the peer set.
- `quadrants?: readonly [string, string, string, string]` — names in reading order (TL, TR, BL, BR), **used only in summaries/announcements, never rendered** — default names generated from axis-relative wording via `SummaryStrings`.
**Variants (3):** `field` on/off → lone-glyph vs against-the-field · quadrant tint off (`style` token) for dense grids · `quadrants` naming → domain-language summaries ("quick win").
**Geometry (`geometry.ts`):**
```ts
quadrantDotGeometry(opts: { width: number; height: number; data: { x: number; y: number };
  field?: readonly { x: number; y: number }[]; xDomain?: readonly [number, number];
  domain?: readonly [number, number]; split?: readonly [number, number]; pad?: number }): {
  cross: { x: number; y: number };
  dot: { x: number; y: number };
  ghosts: { x: number; y: number }[];
  quadrant: 0 | 1 | 2 | 3;          // TL, TR, BL, BR; boundary rule: ≥ split ⇒ right/top
  peersInQuadrant: number;
}
```
**New core needs:** none.
**Interactive entry:** focal announced on focus; ←/→ cycle field ghosts (nearest-neighbor order from the focal), each announced with coords + quadrant. Live region: `"Peer 3 of 12: effort 6, impact 4 — high-effort, low-impact."` Pointer: nearest dot within a 3-unit hit radius.
**Summary (`quadrantSummary`):** template `{yLabel} {yv}, {xLabel} {xv} — in the {quadrantName} quadrant ({k} of {n} peers there).` → **"Impact 9, effort 3 — in the high-impact, low-effort quadrant (2 of 14 peers)."**
**Edge cases beyond the shared matrix:** focal exactly on a split line → deterministic boundary rule (≥ ⇒ right/top), documented · no field → peers clause omitted, ghosts skipped · degenerate domain on either axis (all-equal) → that axis renders the focal at center with the split cross suppressed on that axis; summary states the constant.
**Size budget:** static ≤ 1.5 kB / interactive ≤ 2.5 kB.
**Honesty notes:** the split point is data (domain midpoint default) and always overridable but never invisible — the cross renders wherever the split truly is; with axes unlabeled at glyph size, `title` + `summary` are load-bearing and the docs make skipping them a named anti-pattern.
**Docs page:** Playground knobs: split, field size, quadrants names, backlog/vendor-eval presets · 4-context angle: table cell per initiative (the classic prioritization table) · why-this-default: 24×24, because the 2×2 is a *position* read, not a scatter plot.

---

### 18. CyclePlot — `cycle-plot`
**Collection:** decision · **Data shape:** S1 + period — `data: readonly number[]`, `period: number` (slots per cycle, 4–12; reshaped row-major: slot = i mod period) · **Source:** plan/16 §Q19
**Question it answers:** What repeats beneath the trend — and is any slot itself drifting?
**Primary encoding:** slot-mean spine position; within-slot micro-trend as second read · **Precision:** medium
**Default render:** viewBox `80×20`. Per slot, a column: (1) the slot's own values across cycles as a tiny polyline in true time order, muted (`trend="line"`); (2) slot mean as a tick, accent. Across slots: (3) the spine — slot means connected, `--mc-fg`. **Local trends are never smoothed and never connected across slot boundaries** — each slot's polyline starts and ends inside its column (plan/16 micro rule). No slot labels by default (`slots` names feed summaries; rendered tags only via `labels` and dropped first under degradation). Node budget: 2/slot + 2, cap 12 slots. `data-mc-ink="ghost" | "data"`.
**Props beyond shared grammar:**
- `period: number` — required — slots per cycle; validated 4 ≤ period ≤ 12 (dev warning outside; the form stops working beyond).
- `slots?: readonly string[]` — slot names (`["Mon", …]`) for summaries/announcements.
- `center?: "mean" | "median"` — default `"mean"` — median for skewed slot distributions; the spine states which it uses in the summary wording.
**Variants (4):** `trend="line" | "none"` — spine-only quiet form · `center="median"` · `labels` → rendered slot tags at ≥ 96 px width · `spine={false}` → within-slot drift only (rare; docs justify).
**Geometry (`geometry.ts`):**
```ts
cycleGeometry(opts: { width: number; height: number; data: readonly number[]; period: number;
  center?: "mean" | "median"; domain?: readonly [number, number]; pad?: number }): {
  slots: { x0: number; x1: number; n: number;
           center: { x: number; y: number; value: number };
           line: { d: string } | null;            // null when n ≤ 1
           drift: number }[];                      // last − first within slot, 2-dp
  spine: { d: string };
}
```
**New core needs:** `quantile` for `center="median"` (Batch 0).
**Interactive entry:** grid lookup (pointer x → slot). Live region: `"Mondays: mean 42 across 6 weeks, rising."` ←/→ step slots; ↑/↓ step cycles within the focused slot (announcing individual observations).
**Summary (`cycleSummary`):** template `Peaks {peakSlot} ({peak}), dips {dipSlot} ({dip}); {driftSlot} {driftDir} across {cycles} {cycleUnit}.` (drift clause only when a slot's |drift| leads and exceeds 10% of the spine range) → **"Peaks Fri (61), dips Sun (38); Mon rising across 6 weeks."**
**Edge cases beyond the shared matrix:** `data.length` not a multiple of `period` → ragged final cycle; per-slot n differs and is carried in geometry (announcements say "across 5 weeks" for short slots) · `period ≥ data.length` → every slot has ≤ 1 point: no local lines, spine only, summary drops the drift clause · nulls → excluded from that slot's center and line (gap), never interpolated.
**Size budget:** static ≤ 2 kB / interactive ≤ 3 kB.
**Honesty notes:** the two reads stay separate by construction — the spine is only centers, the local lines are only raw within-slot values in time order; nothing is ever smoothed across a period boundary; `center` choice is explicit and named in docs copy.
**Docs page:** Playground knobs: period, center, trend, weekday-traffic/monthly-sales presets · 4-context angle: KPI card ("the week has a shape") · why-this-default: mean spine + raw slot lines, because seasonality and drift are different questions asked of the same data.

---

### 19. ChangePoint — `change-point`
**Collection:** decision · **Data shape:** S1 — `data: readonly number[]` · **Source:** plan/16 §Q8
**Question it answers:** When did the behavior change level?
**Primary encoding:** break marker position + regime shading · **Precision:** high for the break location, heuristic for its existence (see honesty)
**Default render:** viewBox `80×16`. Z-order: (1) regime background shading — alternating 3%/6% neutral tint per detected segment (identity, not valence); (2) per-regime mean hairlines (`means` default true); (3) the series line; (4) break markers — vertical hairline + small top triangle per break; (5) `label="delta"`: signed % change across the most recent break, ch-gutter. ≤ 6 nodes + 3/break. `data-mc-ink="region" | "ghost" | "data" | "flag" | "label"`.
**Props beyond shared grammar:**
- `breaks?: "auto" | readonly number[]` — default `"auto"` — explicit indices **override detection entirely**; production anomaly pipelines should pass their own (docs say so prominently).
- `max?: number` — default `2` — maximum detected breaks (1–3; more regimes stop being glanceable).
- `means?: boolean` — default `true` — per-regime mean hairlines.
**Variants (4):** explicit `breaks` → detector off, chart becomes pure annotation · `max` 1–3 · `means` off · `label="delta" | "none"`.
**Geometry (`geometry.ts`):** the detector lives here, not in core (plan/21 §6.0.C):
```ts
detectBreaks(values: readonly number[], max?: number, minSeg?: number): number[];
changePointGeometry(opts: { width: number; height: number; data: readonly number[];
  breaks?: "auto" | readonly number[]; max?: number; means?: boolean;
  domain?: readonly [number, number]; pad?: number }): {
  line: { d: string };
  segments: { x0: number; x1: number; meanY: number; mean: number }[];
  breaks: { index: number; x: number; before: number; after: number; delta: number }[];
}
```
Detector (documented as a **heuristic, not statistics**): two-segment mean-shift via binary segmentation — for each candidate split, compare pooled vs split sum-of-squares; accept when SS reduction ratio > 0.2 **and** |Δmean| ≥ 0.8 · pooled SD; recurse into segments up to `max`; minimum segment length `max(3, ⌈n/10⌉)`. All three constants are named exports, stated in docs, and property-tested: no break on constant or iid-noise series below threshold; exact index on a clean step; at most `max` breaks always.
**New core needs:** none (detector is chart-local by design).
**Interactive entry:** nearest-x announces value + regime: `"Point 40: 51 — regime 2 of 3, mean 48."` Breaks are first-class keyboard stops: Tab cycles breaks announcing `"Break at point 34: mean 32 to 48 (+50%)."`; ←/→ step points.
**Summary (`changePointSummary`):** template `Level shifted {dir} {delta} around point {i} (mean {before} → {after}); {tail}.` → **"Level shifted up 50% around point 34 (mean 32 → 48); stable since."** No breaks: **"No clear level shift across 90 points."**
**Edge cases beyond the shared matrix:** gradual ramp (no step) → binary segmentation on trends finds spurious mid-splits; the effect-size gate suppresses most, and docs steer trend questions to Sparkline — named limitation · `n < 8` → detection off (explicit `breaks` still honored) · nulls/NaN → excluded from segment statistics, line gaps as usual · explicit break indices out of range → dropped with dev warning.
**Size budget:** static ≤ 2.5 kB / interactive ≤ 3.5 kB.
**Honesty notes:** docs never use "statistically significant" — the detector is a labeled heuristic with stated constants; explicit `breaks` is the recommended production path; regime shading is neutral (identity), valence only in the delta label via standard polarity.
**Docs page:** Playground knobs: breaks auto/manual, max, means, clean-step/ramp/noisy presets (the ramp preset demonstrates the limitation honestly) · 4-context angle: sentence ("errors stepped up ▁▁▂▆▆ +50% on the 14th") · why-this-default: context for every anomaly — a spike means nothing without the regime it broke.

---

### 20. EnsembleGhosts — `ensemble-ghosts`
**Collection:** decision · **Data shape:** structured — `data: readonly (readonly number[])[]` (ensemble members, 2–50) · **Source:** plan/16 §Q4
**Question it answers:** What could happen — across the simulated futures?
**Primary encoding:** path bundle spread; one emphasized representative · **Precision:** low (spread read — docs steer to ForecastCone for interval precision; this type earns its place for *shape* diversity that bands erase)
**Default render:** viewBox `80×20`. Z-order: (1) up to `ghosts` (default 8, cap 12) member paths, faint (`--mc-muted`, low opacity); (2) one emphasized path, `--mc-accent`; (3) optional endpoint dots on ghosts (`endpoints`) making final-value spread countable. Ghost **selection is deterministic**: members ranked by endpoint value, picked at evenly spaced quantiles of that ranking — same input, same ghosts, every render (SSR/hydration + visual-test determinism; `Math.random` banned, and no jitter needed). ≤ 14 nodes at cap. `data-mc-ink="ghost" | "data"`.
**Props beyond shared grammar:**
- `ghosts?: number` — default `8` — rendered member count (selection rule above).
- `emphasis?: "nearest-median" | "median" | number` — default `"nearest-median"` — a *real member* closest (L2) to the pointwise median; `"median"` draws the synthetic pointwise median (allowed, but the summary then says "typical path" and docs flag it as synthetic); a number pins a specific member (e.g. "the plan of record").
- `endpoints?: boolean` — default `false` — ghost endpoint dots.
**Variants (4):** `ghosts` count · `emphasis` mode · `endpoints` · `curve`.
**Geometry (`geometry.ts`):**
```ts
selectGhosts(series: readonly (readonly number[])[], k: number): number[]; // member indices, deterministic
ensembleGeometry(opts: { width: number; height: number; data: readonly (readonly number[])[];
  ghosts?: number; emphasis?: "nearest-median" | "median" | number;
  domain?: readonly [number, number]; pad?: number }): {
  ghostPaths: { d: string; member: number }[];
  emphasisPath: { d: string; member: number | null };  // null ⇒ synthetic median
  spread: { lastLo: number; lastHi: number };           // endpoint range across ALL members
}
```
**New core needs:** `quantile.quantiles` for selection + pointwise median (Batch 0). `jitter.ts` **not** used — selection is rank-deterministic, no seeding needed.
**Interactive entry:** the HOP loop — this is the one place animation adds measured value (plan/16 Q4): on hover or focus, cycle members one at a time at full opacity, ~400 ms/frame (≈ 2.5 Hz, the studied HOP cadence), looping until pointer leaves / blur; frames drawn via WAAPI opacity swaps on pre-rendered paths (no re-render per frame). **Reduced-motion: no loop** — ←/→ steps members discretely instead (one member emphasized per press), which is the same information without motion. Live region announces only on keyboard step or loop stop (never per frame): `"Member 7 of 24; ends at 42."`
**Summary (`ensembleSummary`):** template `{n} simulated paths end between {lo} and {hi}; typical path ends near {mid}.` → **"24 simulated paths end between 31 and 58; typical path ends near 44."**
**Edge cases beyond the shared matrix:** single member → no ghosts, no loop; docs steer to Sparkline · members of unequal length → each drawn to its own length on a shared index-based x scale (documented; never truncated to the shortest) · members containing NaN → that member excluded from selection/median with dev warning · `ghosts ≥ members` → all drawn, selection skipped.
**Size budget:** static ≤ 2 kB / interactive ≤ 3.5 kB (loop logic).
**Honesty notes:** a static frame is **not** a HOP — no docs copy may claim the HOP accuracy findings for the static render (plan/16 honors the research verdict; so do we); the loop is the HOP and lives only in the interactive entry, reduced-motion gated with a stated non-animated equivalent; ghost selection and emphasis are deterministic and documented — nothing about this chart may vary between renders of the same data.
**Docs page:** Playground knobs: ghosts, emphasis, endpoints, hover-to-loop demo front and center · 4-context angle: KPI card ("the futures, not the average") · why-this-default: few faint paths + one emphasized, because a mean line hides that futures disagree in *shape*, not just endpoint.

---

---

### 21. IconArray — `icon-array` (ADDED 2026-07-08 · schedule with PRs 1–4)

**Collection:** decision · **Data shape:** S4 scalar rate — `value: number` (0–1 probability or `{k, n}` count-of-denominator via `of`) · **Source:** plan/16 §Q21 (added 2026-07-08; provenance plan/12 §catalog-expansion)
**Question it answers:** How likely is this, really? — one stated rate made countable, denominator visible.
**Primary encoding:** count of filled units in a fixed N-unit grid · **Precision:** high (unit-countable; the whole point).
**Default render:** viewBox `60×24`. A fixed grid of N units (default N=20, 10×2): filled units first, contiguous from the top-left in reading order (scattered fills are harder to count — medical-risk literature, plan/16 Q21 row), remainder hollow with hairline stroke (shape-distinct, survives forced-colors — never lightness-alone). Optional right-gutter label "3 in 20" (`label="ratio"`, default on: the denominator IS the honesty). 1 node/unit + label; documented caps N ∈ {10, 20, 100} (100 renders 10×10 at ≥ 40×40 viewBox; other N rejected in dev — grid legibility is designed, not arbitrary). Tokens: `--mc-accent` filled, `--mc-muted` hollow; `data-mc-ink="unit"` / `"unit-off"`.
**Props beyond shared grammar:**
- `value: number` · required · the rate (0–1) — rounded to the nearest unit of N with the rounding direction documented (half-up); exact k when `of` is used.
- `of?: 10 | 20 | 100` · `20` · the denominator/grid size — pick the natural framing ("1 in 10" vs "3 in 100"); N is the message's units, so it's explicit, never auto.
- `label?: "ratio" | "percent" | "none"` · `"ratio"` · "3 in 20" beats "15%" for lay reading (plan/16 rule #3); percent available for numerate contexts.
- `shape?: "square" | "round" | "dot"` · `"square"` · shared cell vocabulary (plan/21 §3) — round/dot for softer product surfaces; counting unaffected.
**Variants (2–6):** `of` (10/20/100 framings) · `label` · `shape` · `positive="down"` polarity (a risk where fewer is better vs an uptake where more is better flips fill color semantics, documented).
**Geometry (`geometry.ts`):**
```ts
export function iconArrayGeometry(opts: {
  width: number; height: number;
  k: number; n: 10 | 20 | 100;       // k already resolved from value×n, half-up, clamped [0, n]
  shape: "square" | "round" | "dot"; gutterCh: number;
}): { units: { x: number; y: number; filled: boolean }[]; cell: number; rx: number; labelX: number }
```
**New core needs:** none (grid math is trivial and local; `core/calendar.ts` is NOT used — no week semantics).
**Interactive entry:** pointer → unit by grid lookup announces the running count ("Unit 7 of 20 — filled. 3 of 20 filled."); ←/→/↑/↓ 2-D roving (ActivityGrid keyboard model reused). Genuinely useful for SR users counting; still simple enough that the entry stays ≤ +0.8 kB.
**Summary (`iconArraySummary`):** real example: **"3 in 20. About 15%."** With `positive="down"`: same string — polarity affects color, never the count. Degenerate: k=0 → **"0 in 20."**; k=n → **"20 in 20 — all."**
**Edge cases beyond the shared matrix:** value outside [0,1] clamped + dev-warned · value×n rounding to 0 while value > 0 → render 0 filled but summary appends "(less than 1 in 20)" — never fake a partial unit · `of` mismatch with `{k,n}` input → n wins, dev-warned · N=100 below 40×40 viewBox → dev warning (unit size under crispness floor).
**Size budget:** static ≤ 1.8 kB / interactive ≤ 2.6 kB.
**Honesty notes:** no partial-unit fills ever (a 37% unit is a lie in a counting chart — round and say so) · contiguous fill order fixed (no scatter mode; scatter is harder to count and only looks more "organic") · denominator always recoverable from the mark itself (grid size) even with `label="none"`.
**Docs page:** Playground: value, of, label, shape, positive. 4-context: sentence hero ("adverse events: ▦ 1 in 20"). "Why this default": ratio label + fixed grid = the two moves that kill denominator neglect (cited on-page).

## Batch-level risks & open questions

**Mandatory plan/12 audit entries (batch gate — plan/21 §7 requires these before Batch 3):**

1. **BenchmarkStrip citation gap.** plan/16 (and the CLAUDE.md catalog line "strongest research") groups BenchmarkStrip with QuantileDots/GradedBand, but cites no study for the band+dot+stated-percentile form itself — its grounding is design inference from the quantile/uncertainty literature, not a direct result. plan/12 entry must classify it **inferred-from-adjacent-research**, and no external docs copy may claim study backing for this specific type until a source exists.
2. **QuantileDots count validation.** The 97%-of-optimal result (Kay 2016 / Fernandes 2018) was measured with 50-dot quantile dotplots. Our 15–20 default is a micro-scale countability judgment, not a validated equivalence. plan/12 entry: **verified-for-50-dots / unvalidated-at-20**. Docs copy may cite the research for the *format*, never for our dot count. Follow-up candidate: a small internal read-back test across 15/20/50 at chart sizes.
3. **HOP cadence at micro scale.** The ~400 ms frame rate comes from HOP studies at larger canvas sizes; micro-scale legibility of the loop is assumed. Log as assumption; tune against the visual-review pass.

**Engineering risks:**

4. **ChangePoint detector constants** (SS-reduction 0.2, effect size 0.8·SD, min segment `max(3, ⌈n/10⌉)`) are engineering defaults. Before the chart's docs page ships, run them across the shared fixture library + a ramp/noise corpus and adjust once; constants are named exports so tuning is one commit. The ramp false-positive limitation stays documented regardless.
5. **ShiftHistogram normalization rule** (per-side proportions, shared height scale) is the batch's most subtle honesty rule — property-test it explicitly (scaling one side's n by 10× must not change rendered heights).
6. **Node budgets** for dot/bin/row charts rely on plan/21 §1's per-cell budget clause; each such chart's containment test also asserts its documented cap.
7. **Kernel dependency:** seven charts block on `core/quantile.ts` and one on `core/bin.ts` — Batch 0 must land them property-tested first; nothing in this batch may inline a quantile implementation.
8. **Summary breadth:** this batch adds ~20 `SummaryStrings` template families (frequency phrasing, quantile phrasing, regime phrasing). Land them in one `SummaryStrings` extension PR early in the batch (with charts 1–4) so later charts don't each grow the i18n surface ad hoc.
