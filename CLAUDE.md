# microcharts — CLAUDE.md

Word-sized charts for React. Zero dependencies, ~1–2 kB gzip per chart, accessible by default, handcrafted-feeling. Brand: **microcharts**. Primary package: **`@microcharts/react`** (name live on npm; unscoped `microcharts`/`microchart` are blocked for everyone by npm's similarity rule — never retry them).

## Design Context

### Users

Expert chartists, UI engineers, and product developers embedding dense, glanceable data into sentences, table cells, KPI cards, tabs, editorial layouts, and AI-generated interfaces. Their job is to communicate one decision-relevant signal immediately, without surrendering accessibility, performance, or implementation quality.

### Brand Personality

Precise, handcrafted, and quietly audacious. The experience should create confidence first, then reward attention with restrained delight. It should feel like an expert instrument with a human hand behind it: never clinical, ornamental, or self-impressed.

### Aesthetic Direction

Micro-scale editorial instruments: crisp geometry, strong rhythm, direct labeling, purposeful semantic color, and occasional expressive forms whose novelty comes from an unusually apt encoding. Modern and futuristic means sharper thinking and better behavior—not neon glow, glass effects, dashboard chrome, or decorative complexity. Every chart must remain excellent in light, dark, print, and dense product contexts.

### Design Principles

1. Earn every mark: each pixel must encode data, state, structure, or a useful interaction cue.
2. Make the first read instant and the second read rewarding; clarity at a glance may reveal finer structure on inspection.
3. Prefer uncommon questions over uncommon shapes: add a chart only when it answers a practical decision that the catalog cannot already answer well.
4. Let delight emerge from motion, rhythm, texture, and direct manipulation without changing the data's meaning.
5. Treat tiny size as a design material, not a limitation: composition, contrast, and summaries must survive the smallest supported context.

**The plan is law.** Every decision below is researched, verified, and cross-referenced in `plan/` (21 docs). Read the specific doc before working in its area; `plan/README.md` is the index. `plan/12-research-audit.md` classifies every claim's provenance — new factual claims must be added there. `plan/chart-gallery.html` is the visual reference for all 96 chart types (self-rendering, zero-dep — open it).

## Non-negotiables (violating any of these is a bug)

1. **Zero runtime dependencies.** `dependencies: {}` forever, CI-enforced. React is a peer: `"react": "^18.0.0 || ^19.0.0"`. Scales, paths, easing, color, stats, summaries — all in-house. Optional capability packages (`@microcharts/outline`, `@microcharts/expressive`) are separate; core never grows a dep. Any third-party dev-dep must be registry-verified actively maintained before adoption.
2. **Budgets are CI gates** (plan/07): ≤ 2 kB gzip per chart subpath (Sparkline ≤ 1 kB), ≤ 10 kB whole library, ≤ 6 SVG nodes typical per chart, 0 client JS for static charts in RSC.
3. **Static-first architecture** (plan/03): default exports are hook-free, listener-free, observer-free pure-SVG components — RSC-safe, SSR-static. Interactivity/animation live only in separate `'use client'` entries (`…/interactive`). Never blur this line.
4. **One grammar** (plan/04): `data` alone always renders something beautiful. Same prop names = same meaning on every chart (`domain`, `color`, `animate`, `title`, `summary`, `label`, `dots`, `format`, `positive`). Variants are props; new data shape = new component. No option-bag objects in the common path. Annotations are children (`<Threshold>`, `<Marker>`, `<TargetZone>`, `<Callout>`, `<Marker celebrate>`).
5. **Accessible by default** (plan/08): every chart `role="img"` + `<title>` + `aria-labelledby` (NOT bare aria-label). Auto-generated natural-language summary (`describeSeries`) is the default accessible name — this is a flagship feature, industry first, verified. `summary={false}` = decorative opt-out. Direction/state never color-alone. Strokes ≥ 4.5:1 contrast in default themes. `prefers-reduced-motion`, `forced-colors`, `prefers-contrast` all handled (exact patterns in plan/08 — they were verification-corrected; don't improvise).
6. **Design principles applied silently**: Tufte/Few ground every default (data-ink, direct labels, no axes/legends/gridlines, areas anchor at zero, color encodes — never decorates, no 3-D/shadows/looping animation, hard-coded away not theme options). **Never name-drop Tufte or theory in external docs, marketing, code comments, or component copy.** The craft shows; it doesn't preach.
7. **Honest encodings**: every chart type has one documented primary encoding channel + precision rating. Delight never lies. Lie factor = 1.

## Stack (verified July 2026 — do not substitute older tools)

pnpm · TypeScript 6 strict (watch `@typescript/native-preview`/tsgo, adopt at stable) · **tsdown** build (tsup is maintenance-only) · **oxlint** + **oxfmt** (prettier fallback) · **lefthook** hooks · **Vitest 4** + @testing-library/react + **@fast-check/vitest** (property tests for all core math); **two projects** — node/jsdom for core math + static SVG attribute assertions, **`@vitest/browser` (Playwright provider) + `vitest-browser-react`** for interactive entries (jsdom has no SVG layout: `getBBox`/`getScreenCTM`/`getComputedTextLength` all return 0) · Playwright `toHaveScreenshot` in pinned Docker + **Argos CI** (Lost Pixel is dead; don't suggest it) · size-limit via custom CI step (the popular GitHub Action is stale) · **knip** (unused deps/exports/files — CI gate keeping zero-dep + tiny surface honest) · publint + arethetypeswrong on release · changesets + npm trusted publishing (OIDC, provenance automatic) · Renovate · MIT · Contributor Covenant 3.0. Docs: **Fumadocs** (React/Next-native — live-prop chart demos are first-class React, no island bridge; Shiki highlighting inherited from `fumadocs-core`, no standalone pin). Local workshop: **Storybook 10** (Vite builder; a11y addon → axe DoD, theme/viewport toggles → light/dark × preset matrix; Chromatic optional, else Argos). **not Sandpack** — stale. ESM-only, per-component subpath exports, `sideEffects: false`, types-first export conditions. **No React Compiler in v1** (its runtime package would be a real dependency under React 18).

## Architecture map (plan/03)

`src/core/` = pure functions, zero React (scale, path, stats, summary, color, bank) — the portable kernel; keep it React-free so string/text/native renderers stay possible. `src/charts/<name>/` = static `index.tsx` + `client.tsx`. `src/shared/` = Chart root wrapper, SparkGroup, motion, a11y. **CSS delivery (plan/19):** one shared `@microcharts/react/styles.css` imported once, `@layer microcharts.{tokens,base,charts,motion}` with `:where()` zero-specificity — NOT per-chart-split; the ≤2 kB/subpath gate measures JS gzip only, CSS is one artifact against the library budget. **Text labels (plan/18):** static path places labels by `text-anchor` + tabular-nums + `ch` gutters — never measures text (unmeasurable server-side); static components must never call `getBBox`/`getComputedTextLength`/`getScreenCTM` (client entries may). Rendering: SVG-first, viewBox + `preserveAspectRatio` + `vector-effect: non-scaling-stroke` for responsiveness (no ResizeObserver by default), integer viewBox coords, `shape-rendering: crispEdges` only on rectilinear marks. Animation: CSS/WAAPI only — **no `d: path()` (no Safari)**, no SMIL, transform/opacity preferred, stroke-dashoffset entrance, one shared IntersectionObserver, all gated on reduced-motion. WASM: never (verified anti-pattern at micro N).

## Theming (plan/06)

~20 CSS custom properties (`--mc-*`) at low specificity = runtime contract; presets = token bundles (`modern` default, `tufte`, `mono`, `vivid`, + context presets `newspaper`/`magazine`/`poster`/`eink`/`print`). Precedence: prop > CSS var scope > preset > default. Presets are visual only — never change data semantics. Colors: Okabe-Ito-derived semantic tokens (pos `#009E73`, neg `#D55E00`), palettes swap the accent only. Dark mode hand-tuned, never inverted. Charts never paint their own background. `tabular-nums` on all rendered numbers.

## Catalog (96 types — plan/05 core 34, plan/16 decision 20, plan/15 expressive 22, plan/17 frontier 20)

v1 = Sparkline (+band), SparkBar (+win-loss), Delta, Bullet, ActivityGrid. **Every chart ships a static default (`…/name`) AND a `…/name/interactive` client entry** — the DoD's "static + interactive entries" is universal, not opt-in (Delta = live announce, Bullet = value/target readout, ActivityGrid = cell hover + 2-D keyboard nav). Skip an interactive entry only when a type has no meaningful interaction, and say why. Then decision micrographs (QuantileDots/GradedBand/BenchmarkStrip first — strongest research). Expressive ships as `@microcharts/expressive`. Not shipping: pie, gauge, battery, waffle, violin (reasons + replacements in plan/05 §4; glanceability research backs it). Cut ledger in plan/15 — don't resurrect cut charts without new evidence. Admission bar for new types: ≤ 200×60 px, unique data story, honest channel, read-back without training.

## Component canon (Phase 2 review, 2026-07-06 — every future chart follows this exactly)

**File anatomy per chart** (`src/charts/<name>/`): `geometry.ts` (pure, React-free, property/edge-tested in the node project) · `index.tsx` (static: hook-free, listener-free, RSC-safe) · `client.tsx` (interactive, `"use client"`) · `index.test.tsx` + `geometry.test.ts` (node) · `client.browser.test.tsx` (real browser). Add the subpath pair to `package.json#exports`, `tsdown` entries, and `.size-limit.json` in the same PR.

**The canonical interactive pattern** (violations = the review's #1 finding; never regress):
1. **Compose the static component** — `<Static… {...props} summary={false}>` with overlay marks (crosshair, focus ring) passed as its `children`. NEVER re-implement the SVG in the client entry; geometry is pure, so both entries computing it get identical numbers and the visual cannot drift.
2. **One pointer listener on the wrapper** + pure math (nearest-x / grid lookup) — never a DOM node per data point (500 rows × 30 points must stay cheap).
3. Wrapper `<span tabIndex={0} role="img" aria-label={title + summary}>` owns naming + roving keyboard; announcements through a polite live region using `SummaryStrings` (i18n contract — **no hardcoded English outside `EN`**). Shared summary text lives in ONE exported function (`bulletSummary`, `activitySummary` pattern) used by both entries.

**Accessible naming (amended plan/08 §1):** default = deterministic composed `aria-label` (+ id-less `<title>`); explicit `id` prop opts into `<title>/<desc>` + `aria-labelledby`. NEVER generate ids in static components (module counters desync under StrictMode/concurrent renders → hydration mismatches). Interactive entries may use `useId`.

**Containment (hard rule):** nothing may paint outside the viewBox — `.mc-root` has `overflow: visible`, so an escape is a layout spill, not a clip. Direct labels reserve a deterministic gutter BEFORE geometry (`labelMetrics`: fontSize in viewBox units set as an SVG attribute — never em-based CSS for in-chart text — and a 0.62·em/char over-estimate); label y is clamped by font ascent. Every chart ships a containment test asserting coords + estimated text extents ≤ viewBox.

**Runtime + perf rules:** ES2022 floor — no `toSorted`/`toReversed`/etc. (tsc lib ES2023 stays green while Safari < 16.4 crashes; `unicorn/no-array-sort|no-array-reverse` are off in `.oxlintrc.json` for exactly this reason). Number formatting only via `makeFormatter` (`core/format.ts`, cached `Intl.NumberFormat`) — never `new Intl.NumberFormat` in a component. Geometry inputs → outputs must be pure and 2-dp rounded at generation.

**Budgets (measured reality, plan/07 §amended):** static ≤ 3 kB gz per subpath (Delta-class simple charts ≤ 1.5 kB), interactive ≤ static + 1 kB, styles.css ≤ 10 kB shared. SSR bench floor: ≥ ~50 rows/ms.

## Quality bar (plan/09)

Per-chart Definition of Done: static + interactive entries · shared edge-case fixture suite green (empty, single point, all-equal, nulls, all-null, negatives, NaN/±Infinity — documented behavior, this kills the Grafana bug class) · property tests · axe clean + summary correct · visual baselines approved (light/dark × presets) · size budget entry · doc page with 4 contexts (sentence/cell/KPI card/tab) · bench scenario. SVG testing: normalized attribute assertions (coords rounded to 2 decimals at generation), never whole-markup snapshots. React 18 + 19 matrix, StrictMode on.

## Roadmap position (plan/10)

Phases 0–6 with ✋ checkpoints. **`plan/STATUS.md` is the live execution tracker — read it first, and update it in the same commit as any work it tracks** (roadmap = the plan; STATUS = what's actually done). Current status: Phase 0 scaffold built & green on pnpm 11 (uncommitted); 0.3/0.4 partial. Don't skip checkpoint gates; don't start Phase N+1 work mid-Phase N without flagging it.

## Working rules for Claude sessions

- Before implementing in any area, read its plan doc; when code and plan conflict, surface it — don't silently diverge. Plan changes get written back to `plan/` + audit entry.
- Commit style: conventional commits, subject ≤ 50 chars, body only when why isn't obvious.
- Never add a dependency (even dev) without checking registry freshness and noting it in the audit doc.
- Every doc example must be a compiled fixture (docs-as-tests) — never write doc snippets that don't build.
- Bench claims and README numbers must be reproducible from `bench/` — no hand-waved performance marketing.
- When adding a chart type: catalog table row + gallery renderer + spec schema entry + summary template + DoD checklist, in the same PR.
