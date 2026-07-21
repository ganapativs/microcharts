# microcharts — contributor & agent guide

Word-sized charts for React: zero runtime dependencies, ~2–7 kB interactive · ~1–4 kB static per chart, accessible by
default, handcrafted-feeling. They're built to sit _inside_ an interface — a sentence, a table cell, a KPI card, a tab
header, a streamed AI reply — and to be safe for a model to emit and a person to read. Package:
**`@microcharts/react`**.

This file is the working contract for anyone (human or AI) changing the code. The rules below are not style preferences
— several are enforced in CI, and violating them is a bug.

## Design principles

1. **Earn every mark:** each pixel must encode data, state, structure, or a useful interaction cue.
2. **First read instant, second read rewarding:** clarity at a glance may reveal finer structure on inspection.
3. **Prefer uncommon questions over uncommon shapes:** add a chart only when it answers a practical decision the catalog
   cannot already answer well.
4. **Delight without lying:** motion, rhythm, texture, and direct manipulation may delight, but never change what the
   data means.
5. **Tiny size is a design material, not a limitation:** composition, contrast, and summaries must survive the smallest
   supported context.

Charts must remain excellent in light, dark, print, and dense product contexts. "Modern" means sharper thinking and
better behavior — not neon glow, glass, dashboard chrome, or decorative complexity.

## Non-negotiables (violating any of these is a bug)

1. **Zero runtime dependencies.** `dependencies: {}` forever, CI-enforced. React is a peer:
   `"react": "^18.0.0 || ^19.0.0"`. Scales, paths, easing, color, stats, summaries — all in-house. All chart types ship
   in the one `@microcharts/react` package. Any third-party dev-dependency must be verified actively maintained before
   adoption.
2. **Budgets are CI gates:** ≤ 3 kB gzip per static subpath (≤ 2 kB target, simple "Delta-class" charts ≤ 1.5 kB),
   interactive ≤ static + 1 kB, shared kernel ≤ 5 kB, `styles.css` ≤ 12 kB, ≤ ~6 SVG nodes typical per chart, 0 client
   JS for static charts in RSC. `.size-limit.json` is generated (`scripts/gen-size-limits.mjs` from
   `scripts/size-budgets.json`), never hand-edited. **Two of these ceilings no longer describe the shipped budgets and
   need a decision** (recorded as `$seat` / `$ceilings` in `size-budgets.json`): 22 statics sit above 3 kB, none by more
   than 0.96 kB; and `interactive ≤ static + 1 kB` is currently unreachable — 101 of 105 interactive entries are above
   that delta (most by ~1.8–2.3 kB), because size-limit measures each subpath standalone and so charges every one of
   them the full shared picker kernel. A NEW chart is still held to 3 kB / +1 kB; the exceptions are not a precedent.
3. **Static-first architecture:** default exports are hook-free, listener-free, observer-free pure-SVG components —
   RSC-safe, SSR-static. Interactivity and animation live only in separate `'use client'` entries (`…/interactive`).
   Never blur this line.
4. **One grammar:** `data` alone always renders something correct. The same prop name means the same thing on every
   chart (`domain`, `color`, `title`, `summary`, `label`, `dots`, `format`, `positive`). Variants are props; a new data
   shape is a new component. No option-bag objects in the common path. Annotations are children (`<Threshold>`,
   `<Marker>`, `<TargetZone>`, `<Callout>`).
5. **Accessible by default:** every chart is `role="img"` with a `<title>`. An auto-generated natural-language summary
   (`describeSeries`) is the default accessible name; `summary={false}` is the decorative opt-out. Direction and state
   are never color-alone. Strokes clear 4.5:1 contrast in the default themes. `prefers-reduced-motion`, `forced-colors`,
   and `prefers-contrast` are all handled — follow the existing patterns; don't improvise them.
6. **Design applied silently:** data-ink first, direct labels, no axes/legends/gridlines, areas anchor at zero, color
   encodes and never decorates, no 3-D/shadows/looping animation. These are hard-coded away, not exposed as theme
   options. The craft shows in the output; the code and copy don't lecture about it.
7. **Honest encodings:** every chart type has one documented primary encoding channel and a precision rating. Lie factor
   = 1.

## Not shipped (by design)

Pie, needle-gauge/speedometer, battery, waffle, and violin are intentionally excluded — each fails at micro scale or on
the honest-encoding bar, and each has a strictly-better in-catalog replacement (Bullet for gauges, SegmentedBar for pie,
MicroBox for violin). Admission bar for any new type: ≤ 200×60 px, a unique data story, an honest channel, readable
without training.

## Stack

pnpm · TypeScript strict · **tsdown** build · **oxlint** + **oxfmt** · **lefthook** hooks · **Vitest** +
@testing-library/react + **@fast-check/vitest** (property tests for all core math), in **two projects** — node/jsdom for
core math + static SVG attribute assertions, and `@vitest/browser` (Playwright provider) + `vitest-browser-react` for
interactive entries (jsdom has no SVG layout: `getBBox`/`getScreenCTM`/`getComputedTextLength` return 0) · Playwright
screenshots + **Argos** for visual review · size-limit as a custom CI step · **knip** (unused deps/exports/files) ·
publint + arethetypeswrong on release · changesets + npm trusted publishing (OIDC, provenance). Docs: **Fumadocs** +
Next static export. ESM-only, per-component subpath exports, types-first export conditions, and a **narrow `sideEffects`
allowlist — never `false`**: `**/*.css` and `./dist/shared/motion-engine.js` both carry load-bearing side effects (the
stylesheet is a bare import; the engine self-registers via `registerMotionEngine` at module scope), so `false` would let
a bundler legally drop them and silently ship unstyled or unanimated charts. Everything outside those two globs still
tree-shakes. Bundle analyzers that only test `sideEffects === false` will label the package "some side-effects" — that
badge is a heuristic, not a regression; don't "fix" it.

## Architecture map

- `src/core/` — pure functions, zero React (scale, path, stats, summary, color, format, labels). The portable kernel;
  keep it React-free so string/text/native renderers stay possible.
- `src/charts/<name>/` — `geometry.ts` (pure, React-free) · `index.tsx` (static, RSC-safe) · `client.tsx` (interactive,
  `'use client'`).
- `src/shared/` — the `Chart` root wrapper, `SparkGroup`, motion engine, a11y, annotations.
- **CSS delivery:** one shared `@microcharts/react/styles.css`, imported once, in
  `@layer microcharts.{tokens,base,charts,motion}` with `:where()` zero-specificity so consumer styles always win. The
  per-subpath size gate measures JS gzip only; CSS is one artifact.
- **Text labels:** the static path places labels by `text-anchor` + tabular-nums + reserved gutters — it never measures
  text (unmeasurable server-side). Static components must never call `getBBox` / `getComputedTextLength` /
  `getScreenCTM`; client entries may.
- **Rendering:** SVG-first, `viewBox` + `preserveAspectRatio` + `vector-effect: non-scaling-stroke` for responsiveness
  (no ResizeObserver by default), integer viewBox coords, `shape-rendering: crispEdges` only on rectilinear marks.
- **Animation:** CSS/WAAPI only — no `d: path()` (no Safari), no SMIL; transform/opacity preferred, stroke-dashoffset
  entrance, one shared IntersectionObserver, all gated on reduced-motion.

## Theming

~Two dozen `--mc-*` CSS custom properties at low specificity are the runtime contract; presets are token bundles
(`modern` default, `editorial`, `mono`, `vivid`, plus output-context `print`/`eink`). Precedence: prop > CSS var scope >
preset > default. Presets are visual only and never change data semantics. Colors are matte semantic tokens on Okabe-Ito
hue geometry — CVD-safe (bluish-green positive `#0E7A5F` vs vermillion negative `#BD4B2D`), deepened for an editorial,
non-poppy finish; palettes swap the accent only. Dark mode is hand-tuned, never inverted. Charts never paint their own
background. `tabular-nums` on all rendered numbers, in `--mc-font-numeric` (tracks `--mc-font`; give figures a
mono/brand face without touching labels). `--mc-label-weight` sets label weight; `--mc-density` scales stroke + label +
gap together (compact `< 1` vs comfortable `> 1`, box untouched). `defineTheme` (`@microcharts/react/theme`, opt-in
subpath, in-house OKLCH, zero-dep) derives a matched CVD-safe palette + hand-tuned-style dark twins from one accent —
never moving the valence hues; returns `vars`/`style`/`css(selector)`/`extend()`. Categorical charts (SegmentedBar,
StackedArea, PartitionStrip, Hypnogram, MicroDonut) take a per-instance `colors[]` over `--mc-cat-*` (additive inline
override — the `data-mc-cat` attribute stays for motion + forced-colors). (The principled preset is named `editorial`.)

## Component canon (every chart follows this)

**File anatomy** (`src/charts/<name>/`): `geometry.ts` (pure, property/edge-tested in the node project) · `index.tsx`
(static: hook-free, listener-free, RSC-safe) · `client.tsx` (interactive) · `index.test.tsx` + `geometry.test.ts` (node)
· `client.browser.test.tsx` (real browser). Add the subpath pair to `package.json#exports`, the `tsdown` entries, and
`.size-limit.json` in the same PR.

**The canonical interactive pattern** (never regress):

1. **Compose the static component** — render `<Static… {...props} summary={false}>` with overlay marks (crosshair, focus
   ring) as its `children`. Never re-implement the SVG in the client entry; geometry is pure, so both entries compute
   identical numbers and the visual cannot drift.
2. **One pointer listener on the wrapper** + pure math (nearest-x / grid lookup) — never a DOM node per data point (500
   rows × 30 points must stay cheap).
3. Wrapper `<span tabIndex={0} role="img">` owns naming + roving keyboard; announcements go through a polite live region
   using `SummaryStrings` (the i18n contract — no hardcoded English outside `EN`). Shared summary text lives in one
   exported function used by both entries.

**Accessible naming:** default = a deterministic composed `aria-label` (plus an id-less `<title>`); an explicit `id`
prop opts into `<title>/<desc>` + `aria-labelledby`. Never generate ids in static components (module counters desync
under StrictMode/concurrent renders → hydration mismatches). Interactive entries may use `useId`.

**Inline seat (every chart emits one):** a chart passes `seat={{ mode, top, bottom }}` to `<Chart>` so `.mc-inline` can
sit it on a line of text — `mode: "floor"` when the mark has a meaningful bottom (bars, areas, columns: its floor lands
on the text baseline like a letter), `mode: "center"` when it's symmetric with no floor (glyphs, dials, strips, rows,
anything anchored on a midline: its box centres on the cap band). Coordinates are viewBox units from the top. Pass the
**plot box**, never the data bounding box — a data-derived seat makes the mark bob vertically as values change — and
never the raw viewBox when a label gutter would drag the plot off the line. If the plot box depends on a prop, branch on
it: `SparkBar` is floor in bar mode and centre in win-loss. Geometry owns the box: export `y0`/`y1` from `geometry.ts`
rather than re-deriving padding in `index.tsx`. `Chart` turns the seat into `--mc-seat`/`--mc-seat-mid`, which are
registered with `@property … inherits: false` precisely so a seat can't leak down the tree into another chart. A chart
that omits `seat` silently falls back to the legacy viewBox-bottom seat and will ride high — adding one is part of
shipping a chart, not an optimisation. The two exceptions are `Delta` and `TokenConfidence`, which render inline HTML
rather than `<Chart>` and own their own baseline.

**Containment (hard rule):** nothing may paint outside the viewBox — `.mc-root` has `overflow: visible`, so an escape is
a layout spill, not a clip. Direct labels reserve a deterministic gutter before geometry (fontSize in viewBox units set
as an SVG attribute — never em-based CSS for in-chart text — with a per-char over-estimate); label y is clamped by font
ascent. Every chart ships a containment test asserting coords + estimated text extents ≤ viewBox.

**Runtime + perf:** ES2022 floor — no `toSorted`/`toReversed`/etc. (Safari < 16.4 crashes even though the tsc lib is
newer). Number formatting only via `makeFormatter` (`core/format.ts`, cached `Intl.NumberFormat`) — never
`new Intl.NumberFormat` in a component. Geometry inputs → outputs must be pure and 2-dp rounded at generation.

## Quality bar (per-chart Definition of Done)

Static + interactive entries · shared edge-case fixture suite green (empty, single point, all-equal, nulls, all-null,
negatives, NaN/±Infinity — documented behavior) · property tests · axe clean + summary correct · visual baselines
approved (light/dark × presets) · size-budget entry · an inline `seat` · a doc page · a bench scenario. SVG testing uses
normalized attribute assertions (coords rounded to 2 decimals at generation), never whole-markup snapshots. React 18 +
19 matrix, StrictMode on.

## Docs site (`apps/docs`)

Independent pnpm workspace. **Fumadocs + Next static export (`output: 'export'`)** — deployable to any static host. It
consumes the built library (`@microcharts/react` → `dist/`), so **build the library before building or developing the
docs** (`pnpm build:site` does both). The site origin is swappable via `NEXT_PUBLIC_SITE_URL`. Every doc example must be
a real, compiled component (docs-as-tests): `describeSeries` output shown in docs must be the actual generated string.
The docs also publish machine surfaces — `/llms.txt`, `/llms-full.txt`, and `/catalog.json` — kept in sync with
`package.json#exports` and gated by tests.

## Working rules

- Commit style: conventional commits, subject ≤ 50 chars, body only when the "why" isn't obvious.
- Never add a dependency (even a dev one) without checking that it's actively maintained.
- Every doc example must be a compiled fixture — never write snippets that don't build.
- Bench and README numbers must be reproducible from `bench/` — no hand-waved performance claims.
- When adding a chart type, do it all in one PR: the chart, its tests, its gallery/registry entry, its summary template,
  its doc page, and its size-budget entry.
