# 07 — Performance & Size Budgets

> Status: draft v1 · "Micro CPU, micro RAM, micro bundle" made falsifiable. Every number here becomes a CI gate.
> **AMENDED 2026-07-08 (budget model v2, [21-full-catalog-buildout.md](21-full-catalog-buildout.md) §1):**
> the whole-library ≤ 10 kB gate is retired — it was written for a 5-chart v1 and is arithmetically
> impossible at 96 types, and it measured the wrong thing (users pay per subpath, not per barrel).
> Replacements: shared kernel ≤ 5 kB (proxied by the minimal-chart subpath), `styles.css` ≤ 12 kB,
> barrel size tracked + published honestly but not gated. Per-subpath gates unchanged.
> `.size-limit.json` is generated from `scripts/size-budgets.json` (Batch 0), never hand-edited.

## 1. Budgets (CI-enforced, size-limit + benchmark suite)

| Metric | Budget | Gate |
|---|---|---|
| Gzip per static chart component (incl. shared core, tree-shaken) | **≤ 3 kB** hard gate · ≤ 2 kB target · ≤ 1 kB stretch | size-limit per subpath export |
| Gzip per interactive (`…/interactive`) chart entry | **≤ 4 kB** hard gate | size-limit per subpath export |
| ~~Whole library gzip (all v1 charts + styles) ≤ 10 kB~~ | **Retired 2026-07-08** → shared kernel ≤ 5 kB · styles.css ≤ 12 kB · barrel tracked not gated (plan/21 §1) | size-limit + CI report |
| Runtime dependencies | **0** | CI check on package.json + lockfile |
| Client JS for static charts (RSC) | **0 bytes** | bundle-analysis test on Next.js fixture |
| 500 sparklines initial render (M-class laptop, Chrome) | **< 50 ms scripting** | tinybench + Playwright CPU trace, tracked not hard-gated initially |
| SVG nodes per chart | ≤ 6 typical, ≤ 12 max (documented per chart) | unit test |
| Re-render on data update (1 chart) | < 0.5 ms | benchmark suite |
| Memory for 1,000 static instances | < 10 MB JS heap delta | benchmark suite, tracked |

Anchors from research: @fnando/sparkline = 1.6 kB proves feasibility; react-sparklines = 6.6 kB is the ceiling of embarrassment; Chart.js 68 kB / Recharts 145 kB are the marketing foil.

**Measured reality (2026-07-06, Phase 2.1).** The shipped `<Sparkline>` is **2.67 kB** gzip: line/smooth/step + area + band + dots + label + the auto-summary a11y name (the flagship) + the `<Chart>` shell. The 1–2 kB anchors were set against *line-only* refs (@fnando has no summary, no a11y, no smooth/area/band); our value-adds are the delta. Gate raised to **≤ 3 kB static / ≤ 4 kB interactive** to reflect the honest full-feature cost, with 2 kB kept as the target and 1 kB as a stretch for a stripped line-only build. Still ~50× smaller than Recharts. Dominant weight is the path/scale/stats math kernel (~2.5 kB treeshaken), not the summary (+~0.15 kB, since `seriesStats` is shared). See plan/12 audit.

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
