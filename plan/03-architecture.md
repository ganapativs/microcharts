# 03 — Architecture

> Status: draft v1 · Inputs: performance research (verified July 2026), RSC/React 19 research

## 1. Decisive choices

| Decision | Choice | Why |
|---|---|---|
| Rendering | **SVG-first** | At micro scale cost ∝ node count; each chart is 1–5 nodes. Free DPR crispness, SSR-able, styleable, accessible. Canvas escape hatch deferred (only matters past ~1–2k elements / per-frame scroll churn). |
| Dependencies | **Zero.** React is a peer (`"react": "^18.0.0 || ^19.0.0"` — verified as the current idiom, matches @tanstack/react-query's fresh releases). | Scales, paths, easing, color, stats — all in-house. d3-scale is dead weight for `(v-min)/(max-min)*h`. |
| React model | **Static-core + interactive wrapper.** Hook-free components that emit pure SVG (RSC-safe, zero client JS) + optional `'use client'` layer for hover/animation/live data. | No RSC-native chart lib exists — this is the differentiator. |
| Responsiveness | **viewBox + `preserveAspectRatio` + `vector-effect: non-scaling-stroke`**, CSS-driven; no ResizeObserver by default. Container queries for density adaptation. | Rich Harris/Pancake technique; zero measurement JS; zero layout thrash. |
| Animation | **CSS transitions/keyframes + WAAPI.** No `d: path()` (no Safari). stroke-dashoffset entrance; transform/opacity preferred; JS `d`-interpolation only in the client layer for morphs. Closed-form spring (<1 kB) if needed. | Zero-dep, compositor-friendly where possible, tiny paint areas make attr animation acceptable. |
| WASM | **No.** | Boundary cost ≥ whole computation at ≤ a few hundred points. |
| Language | TypeScript, strict. Plain arrays (not typed arrays) at micro N. | |
| Compilation | **No React Compiler in v1 — manual memoization only.** (Verified conflict: compile-and-ship with React 18 support requires `react-compiler-runtime` as a *direct dependency* per react.dev — breaks the zero-dep guarantee. Static components are hook-free, so compiler gains ≈ nil anyway.) Revisit when React 18 support drops (target 19 uses React's built-in runtime). | Zero-dep integrity > marginal compiler wins. |

## 2. Package layout

Single npm package, subpath exports (monorepo dirs for docs/site but one published package to start):

```
@microcharts/react  (final; unscoped "microcharts" blocked by npm similarity rule — see README open item 1)
├─ src/
│  ├─ core/               # pure functions, zero React — the portable kernel
│  │  ├─ scale.ts         # linear/band scales (~30 LOC)
│  │  ├─ path.ts          # line/smooth(catmull-rom→bezier)/step/area path builders
│  │  ├─ stats.ts         # min/max/first/last/delta/trend — feeds a11y summaries
│  │  ├─ summary.ts       # natural-language summary generator (i18n-able templates)
│  │  ├─ color.ts         # token resolution, palettes (Okabe-Ito, Tol)
│  │  └─ bank.ts          # bankTo45 width suggestion
│  ├─ charts/
│  │  ├─ sparkline/       # index.tsx (static) + client.tsx (interactive)
│  │  ├─ sparkbar/
│  │  ├─ delta/
│  │  ├─ bullet/
│  │  └─ activity-grid/
│  ├─ shared/
│  │  ├─ Chart.tsx        # root <svg> wrapper: sizing, role=img, aria, tokens
│  │  ├─ group.tsx        # SparkGroup shared-scale context
│  │  ├─ motion.ts        # WAAPI helpers, reduced-motion gate ('use client')
│  │  └─ a11y.ts          # label composition, sr-only table option
│  └─ styles.css          # :where()-scoped token defaults, keyframes, forced-colors/`prefers-*` blocks
├─ package.json           # ESM-only, sideEffects: [*.css], exports map per component
```

`exports`: `"."` (barrel), `"./sparkline"`, `"./sparkbar"`, … per component; `"./styles.css"`. Types-first condition order; validated by publint + attw in CI.

**Future ports** (v3+, only on success): `core/` is React-free by construction → vanilla JS wrapper is mechanical; ASCII/Unicode renderer (`▁▂▄▇`) can be a `core`-consumer for terminals/PDF export; native (Android/iOS) would re-implement renderers over the same core math spec. Keep this a documented path, not built infrastructure.

## 3. Component anatomy (every chart)

```
<Sparkline>                        ── static, RSC-safe, hook-free
  computes: scale → path string → stats → aria label   (pure, memoized on data ref)
  renders:  <svg viewBox role="img" aria-label={autoSummary}>
              [band] [line path] [area path] [min/max dots] [endpoint dot] [annotations]
            </svg>
<Sparkline interactive>            ── client wrapper ('use client' entry)
  adds: hover nearest-point, focus/keyboard, entrance animation, live updates
```

Rules:
- Node budget ≤ 6 SVG elements per chart typical; documented per chart.
- No inline object props in examples/docs (memo-friendly API); data prop is the identity key.
- One shared module-level ResizeObserver *only* in the client layer when pixel measurement genuinely needed (labels).
- `React.memo` on every chart; `useMemo` keyed on `(data, w, h, domain)` in client layer; static layer needs neither (RSC) but is compiled anyway.
- StrictMode-safe teardown; `ref` as plain prop (React 19), no forwardRef.
- Integer/safe viewBox coordinates (avoid sub-pixel rasterization bugs, Carbon #7236); `shape-rendering: crispEdges` only on rectilinear marks.

## 4. Scales & data model

- Input: `number[]` (fast path) or `{x?, y}[]` / `{label, value}[]` per shape family (see `05-chart-catalog.md` §1).
- `domain` prop always available; default: data min/max for lines (documented), zero-anchored for areas/bars (lie factor = 1).
- Nulls/gaps: first-class (`null` breaks line / renders gap marker) — Grafana's still-open bugs prove this is the differentiating edge case; test matrix includes empty, single-point, all-null, all-equal, NaN, ±Infinity.
- `SparkGroup` context provides shared domain + physical size for small multiples (opt-in, precedence: explicit prop > group > auto).

## 5. Performance engineering (budgets in `07-performance.md`)

- Precompute path `d` as string once per data change; no per-render string building.
- No GC churn in hot paths: no map/filter chains in render, reuse arrays in the live-update path.
- Lazy entrance animation via one shared IntersectionObserver.
- Publish the missing public benchmark: "N sparklines: microcharts vs Recharts vs Chart.js vs uPlot" — marketing + regression harness in one.

## 6. Interactivity model (client layer only)

- Hover: single pointermove listener on the svg root; nearest-x lookup on precomputed array — no per-point event targets.
- Keyboard: chart focusable (`tabIndex=0`), arrow keys step points, announced via aria-live (Highcharts pattern, simplified to micro scale); opt-in (`interactive` prop) — default static chart has zero listeners.
- Tooltip = direct label reveal (dot + value text inside the SVG or a positioned sibling), not a floating portal component.
