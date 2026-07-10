# 04 — API Design: One Grammar

> Status: draft v1 · Principle: minimal interface, maximum customization. Learn one chart, know them all.

## 1. The shared prop grammar

Every component accepts the same prop families. A chart is: **data + domain + geometry + ink + motion + a11y + escape hatches**.

```tsx
// The 80% case must be this short:
<Sparkline data={[3, 5, 4, 8, 6, 9]} />
<Delta value={0.124} />
<Bullet value={72} target={80} />
```

```tsx
// Full grammar (same families on every chart):
<Sparkline
  // — data —
  data={values}              // number[] | Point[]  (shape per family)
  domain={[0, 100]}          // y-domain override; default per-chart documented
  // — geometry —
  width={80} height={20}     // numbers (viewBox units) or CSS via className/style
  // — ink (visual variants; enumerated per chart) —
  curve="smooth"             // "linear" | "smooth" | "step"
  fill                       // area variant
  band={[lo, hi]}            // normal-range band
  dots="auto"                // endpoint/min-max dots: "auto" | "none" | config
  label="last"               // direct value label: "none" | "last" | "minmax" | fn
  color="var(--mc-accent)"   // any CSS color; prop > CSS var > preset
  // — motion —
  animate="auto"             // "auto" (on, respects reduced-motion) | false | config
  // — a11y —
  title="Weekly revenue"     // names the chart; combined with auto summary
  summary="auto"             // "auto" (generated) | string | false (decorative)
  // — escape hatches —
  className style            // pass through to root svg
  renderPoint={fn}           // advanced: custom mark rendering
>
  {/* annotation layer — shared components, muted ink */}
  <Threshold y={50} />
  <Marker x={4} label="launch" />
  <TargetZone y={[40, 60]} />
</Sparkline>
```

## 2. Grammar rules (enforced across all 96 chart types)

1. **`data` is always first and always sufficient.** Every other prop has a beautiful default.
2. **Same name = same meaning everywhere.** `domain`, `color`, `animate`, `title`, `summary`, `label`, `dots` never change semantics between charts.
3. **Variants are props, not components** (curve, fill, win-loss mode) — until a variant changes the *data shape*, then it's a new component.
4. **No option-bag objects in the common path** (memo-friendliness; avoids Recharts ceremony). Config objects only for genuinely structured things (`animate={{duration: 200}}`).
5. **Booleans for on/off, strings for modes, `"auto"` as the smart default** (Recharts' `isAnimationActive="auto"` precedent for reduced-motion).
6. **Polarity is explicit**: `positive="up"` (default) | `"down"` (e.g. latency, churn — down is good). Affects color semantics and summary wording everywhere valence exists.
7. **Formatting**: `format` prop takes `Intl.NumberFormat` options or a function; defaults locale-aware. Tabular-nums applied to all rendered numbers.
8. **Children = annotation layer.** `<Threshold>`, `<Marker>`, `<TargetZone>`, `<Callout>` work identically inside every S1/S2 chart.
9. **Composition over configuration** at the edges: `renderPoint`/`renderLabel` render-prop escape hatches instead of 40 styling props.
10. **TypeScript-first**: discriminated unions make invalid prop combos unrepresentable; JSDoc on every prop with default documented; no `any` in the public surface.

## 3. Theming precedence (see `06-design-language.md`)

`prop` > nearest CSS-var scope > `<MicroProvider theme>` / `data-mc-theme` preset > built-in default. All color props accept CSS variables so token indirection survives prop overrides.

## 4. Interactive layer (opt-in, separate entry)

```tsx
import { Sparkline } from "@microcharts/react/sparkline";          // static, RSC-safe, 0 client JS
import { Sparkline } from "@microcharts/react/sparkline/interactive"; // 'use client': hover, keyboard, live
```

Interactive adds (same grammar extension on every chart): `onPointFocus`, `hoverLabel`, `live` (aria-live announcements + endpoint pulse on data change). Static component never ships a listener.

## 5. Group / small-multiples API

```tsx
<SparkGroup domain="shared" width={80} height={20}>
  {rows.map(r => <Sparkline key={r.id} data={r.series} />)}
</SparkGroup>
```
`domain="shared"` computes one domain across children (or takes explicit `[min,max]`); enforces one physical size. This kills the #1 sparkline correctness bug (per-row auto-scaling).

## 6. Naming & docs conventions

- Component names are plain nouns: `Sparkline`, `SparkBar`, `Delta`, `Bullet`, `ActivityGrid`, `DotPlot`, `Progress`…
- Every doc page: hero example (one line), prop table (auto-generated from types), a11y notes, a short "why this default" design-rationale note (grounded in our internal principles — **never name-drops Tufte or theory externally**; the philosophy shows, it doesn't lecture), copy-paste recipes (table cell, KPI card, inline text, tooltip).
- Every chart page shows the same 4 contexts: **in a sentence, in a table cell, in a KPI card, in a tab header** — the product thesis demonstrated repeatedly.

## 7. Anti-goals

- No `<ResponsiveContainer>` wrappers, no `<ChartProvider>` requirement, no context needed for the base case.
- No axis/legend/tooltip subcomponents to assemble — direct labels replace all three at micro scale.
- No prop that exists only to undo a bad default.

## 8. Amendment — prop contract v1 rulings (2026-07-10, superaudit checkpoint 1)

User-approved (audit/FOUNDATION.md on branch `superaudit`; full audit in audit/reports/prop-contract.md). Library is unreleased, so these renames land now; post-release they would be breaking.

1. **`animate` is not a prop.** §1's sketch predates the static-first split: motion ships only in `…/interactive` client entries + CSS (reduced-motion-gated), server output is static. The grammar's motion family is the *entry choice*, not a boolean.
2. **`highlight` addresses a datum by index/label everywhere.** Charts that emphasized a raw domain *value* (histogram-strip, rug-strip) rename that prop to `markValue`.
3. **`emphasis` is reserved for structural units** (a lane/state/boundary: event-raster, hypnogram, partition-strip, trace-fold, ensemble-ghosts). `accent` props fold into `highlight` (datum) or `emphasis` (structure) — no third name.
4. **Denominators:** `total` for discrete counts (icon-array `of`→`total`, tally-marks `max`→`total`); `max` survives only on Progress (continuous goal).
5. **Enum-over-boolean for shared names:** wind-barb `label` and percentile-ladder/star-spoke `dots` become string enums matching the family vocabulary.
6. **Name collisions resolved:** volume-profile `side`→`align`; depth-wedge `range`→`levels`.
7. **Empty-cell vocabulary:** one shared `EmptyCellStyle = "outline" | "blank"` (garden-grid, honeycomb).
8. **Grid sizing:** cell-grid charts share `cell`/`gap` (calendar-strip gains them; honeycomb `cellR`→`cell`, documented as the hex outer radius).
9. **Domains are `readonly [number, number]` everywhere**; shared `Orientation` type in core; single-series charts take gap-aware `Value[]` unless nulls are semantically impossible (justified in the chart's geometry header). heartbeat-blip's timestamp array renames `data`→`events`.
10. **Stroke width roles:** marks carry `data-mc-w="support" | "tick" | "hair"` (⅔ / ½ / ⅓ of `--mc-stroke-width`) instead of literal secondary widths, so presets and `prefers-contrast` scale whole charts. Literal widths remain only for justified geometric strokes.
