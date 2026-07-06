# 07 — Performance & Size Budgets

> Status: draft v1 · "Micro CPU, micro RAM, micro bundle" made falsifiable. Every number here becomes a CI gate.

## 1. Budgets (CI-enforced, size-limit + benchmark suite)

| Metric | Budget | Gate |
|---|---|---|
| Gzip per static chart component (incl. shared core, tree-shaken) | **≤ 2 kB** (Sparkline target ≤ 1 kB) | size-limit per subpath export |
| Whole library gzip (all v1 charts + styles) | **≤ 10 kB** | size-limit on barrel |
| Runtime dependencies | **0** | CI check on package.json + lockfile |
| Client JS for static charts (RSC) | **0 bytes** | bundle-analysis test on Next.js fixture |
| 500 sparklines initial render (M-class laptop, Chrome) | **< 50 ms scripting** | tinybench + Playwright CPU trace, tracked not hard-gated initially |
| SVG nodes per chart | ≤ 6 typical, ≤ 12 max (documented per chart) | unit test |
| Re-render on data update (1 chart) | < 0.5 ms | benchmark suite |
| Memory for 1,000 static instances | < 10 MB JS heap delta | benchmark suite, tracked |

Anchors from research: @fnando/sparkline = 1.6 kB proves feasibility; react-sparklines = 6.6 kB is the ceiling of embarrassment; Chart.js 68 kB / Recharts 145 kB are the marketing foil.

## 2. Techniques (from `03-architecture.md`, operationalized)

- Path `d` computed once per data identity; memoized string. No render-time math beyond prop resolution.
- Static-first: the default export does no hooks, no effects, no listeners, no observers. Interaction is a separate entry.
- One shared IntersectionObserver (entrance animations), one shared ResizeObserver (only when label measurement is on), module-level.
- viewBox scaling handles resize with zero JS.
- Animation: compositor properties where possible; attr animation confined to tiny paint areas; everything skipped under reduced-motion and in SSR output.
- No layout reads in any code path; WAAPI over rAF loops.

## 3. The public benchmark (build in Phase 2, publish with launch)

No public "N tiny charts" benchmark exists — we create the category benchmark:
- Scenario: table with N ∈ {100, 500, 1000} rows, one sparkline per row.
- Measured: initial render scripting time, JS heap, DOM nodes, bundle added, update-one-row time, scroll jank (virtualized + not).
- Contenders: microcharts static, microcharts interactive, Recharts, Chart.js (react-chartjs-2), MUI X SparkLineChart, uPlot, @fnando/sparkline.
- Ships as: repo `bench/` package + live demo page + README table with date + methodology. Re-run in CI weekly (regression tracking) and per release.

## 4. Perf test harness

- **tinybench** micro-benchmarks for core (scale/path/stats) — pure functions, deterministic.
- **Playwright CPU/heap traces** for the table scenario on pinned Chromium in Docker.
- Threshold alerts as CI warnings first; promote to hard gates once variance is understood.

## 5. SSR/RSC verification

- Fixture apps in repo: Next.js (App Router/RSC), Vite SPA, Remix. CI asserts: static chart HTML present in server output; zero client chunks added by microcharts in RSC fixture; hydration-mismatch-free in SPA.
