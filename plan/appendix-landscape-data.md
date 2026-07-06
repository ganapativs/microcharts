# React Microcharts / Sparkline Landscape — Competitive Research (July 2026)

Raw data for planning doc. All npm download figures pulled live from the npm registry API (`api.npmjs.org/downloads/point/last-week`, window 2026-06-28 to 2026-07-04) and registry metadata (`registry.npmjs.org`) on 2026-07-06. Bundle sizes pulled live from Bundlephobia's API where available. GitHub metadata pulled via `gh api`. Figures marked ~approx are not independently verified against a primary source.

---

## 1. Dedicated Sparkline / Microchart Libraries

| Library | Latest version | Last publish | Weekly npm downloads | Gzip size | Deps | Render | React support | Maintenance status | Key features | Key gaps |
|---|---|---|---|---|---|---|---|---|---|---|
| **react-sparklines** (borisyankov) | 1.7.0 | 2017-07-27 | 212,974/wk | 6.6 KB gz | 1 (`prop-types`) | SVG | Native (React component) | **Abandoned.** Last real commit 2020-08-19 (bugfix); last version publish 2017. 63 open issues on GitHub. Issue #133 "Is this still being maintained?" (opened 2020-12-12) got only 3 replies over 5 years, no maintainer response, ending with a user announcing they forked it because the original was dead. | Line/bar/reference-line sparkline components, simple declarative JSX API, still the most-downloaded dedicated React sparkline package by a wide margin. | No React 18/19 concurrent-mode guarantees, no accessibility (no ARIA/text alternative), no animation, no tree-shaking (single bundle), no TS types in the base package (separate `@types/react-sparklines`), unmaintained since 2017-2020. |
| **@lueton/react-sparklines** (fork) | 2.2.0 | ~4 months before 2026-07 (per npm search) | not independently confirmed (low, niche) | not measured | not measured | SVG | Native | **Actively maintained**, but a solo hobby fork with only 10 GitHub stars and 0 open issues (too new to have accumulated any). Explicitly created (per maintainer's own GitHub comment) as a replacement for the dead original. | Same API shape as original for drop-in compatibility. | Unproven adoption; no evidence of TS-first design, testing, or accessibility work; too young to assess long-term maintenance. |
| **@fnando/sparkline** | 0.3.10 | 2018-09-18 | 6,950/wk | 1.6 KB gz | 0 | SVG (framework-agnostic, vanilla JS/DOM) | None — no React wrapper; must hand-roll integration | 545 GitHub stars, 62 forks, but last commit 2023-10-17 and no commits since; 14 open issues. Not actively developed but stable/"finished" in spirit (small scope). | Zero dependencies, genuinely tiny, interactive mouse-move callbacks for tooltips, works with plain arrays or `{value}` objects. | Not React-native (imperative DOM API, needs `useEffect`/ref wiring in React), no built-in theming, no TS types, no built-in accessibility, effectively unmaintained. |
| **jquery-sparkline** (jQuery Sparklines) | 2.4.0 | 2016-11-02 | 33,617/wk | not on Bundlephobia (jQuery plugin, not a modern ESM package) | 0 (peer: jQuery) | Canvas/VML | None (jQuery-only) | **Dead.** No npm publish in ~10 years; requires jQuery as a peer dependency, which is itself in decline in modern React codebases. | Extremely mature feature set (bar/line/pie/box/tristate/discrete/bullet sparkline types) accumulated over ~15 years. | Architecturally incompatible with React (jQuery DOM ownership conflicts with React's virtual DOM); no ESM; no accessibility; effectively legacy-only. |
| **peity** | 3.3.0 | 2018-01-18 | 10,047/wk | not on Bundlephobia | 0 | SVG | None (jQuery-adjacent, vanilla-capable) | Dead — no publish since 2018. | Extremely minimal API (`$(el).peity("line")`), pie/donut/bar/line sparkline types, tiny footprint historically. | No React bindings, imperative jQuery-style API, no maintenance, no accessibility, no animation. |
| **sparkline** (bare npm package "spark") | 0.2.0 | 2017-06-22 | 63,559/wk | not measured | 0 | text/unicode (not a visual chart) | None | Dead since 2017; still gets surprisingly high downloads likely as a transitive dependency of other tools, not direct adoption. | Generates unicode "▁▂▃▅▂▇" bar sparklines for terminal/text output — different problem space (not a visual DOM chart lib). | Not applicable to web UI rendering at all; frequently confused with proper chart libs in searches. |
| **chartist** (chartist-js, community-revived fork) | 1.5.0 | 2025-09-30 | 103,049/wk | 19.8 KB gz | 0 | SVG | None native (community React wrappers exist, e.g. `react-chartist`) | 13,394 GitHub stars, 244 open issues, last push 2026-06-30 — **actively maintained** (revived by chartist-js org after original gionkunz repo stalled). | Zero dependencies, responsive SVG line/bar/pie charts, small footprint (~10-20KB), CSS-based styling/animation. | Not a sparkline-specific library — general-purpose small chart lib retrofitted for sparkline use cases via minimal-axis config; no React-first API; still requires manual "no axes" configuration to look like a sparkline; SVG DOM node count scales with data size, less ideal for many small inline instances on one page (e.g. hundreds of table-cell sparklines). |
| **frappe-charts** | 1.6.2 | 2021-06-16 | 59,456/wk | not measured directly (historically cited ~cited elsewhere as small) | 0 | SVG | None native (community wrappers) | 15,085 GitHub stars but last push 2025-07-02 (~1 year stale as of research date); 144 open issues — **stalled**, not actively developed. | Simple declarative config, animated SVG charts including some "heatmap"/small chart modes, zero deps. | Not sparkline-specific; larger chart-suite scope (axes, legends) not optimized for word-sized rendering; React integration requires wrapping; project velocity has slowed sharply. |
| **react-microcharts** (miriyas) | 1.7.0 | 2020-02-20 | ~1/wk (essentially zero adoption) | not measured | not measured | SVG | Native | **Dead/abandoned.** 3 GitHub stars, last push 2020-05-01, 7 open issues, ~1 download/week — a fork attempt of react-sparklines that never gained traction. | Same API surface as react-sparklines. | No adoption, no maintenance, does not solve any gap the original didn't have. |
| **react-micro-bar-chart** (KyleAMathews) | — | old (pre-2020, D3-based) | very low | not measured | D3 (peer) | SVG (D3-driven) | Native | Effectively dormant hobby project. | D3-rendered micro bar charts. | Pulls in D3 as a dependency for a component whose entire value proposition should be "small"; no evidence of active use or maintenance. |

**Bottom line for category 1:** every dedicated sparkline library either (a) hasn't shipped a release in 5-10 years, or (b) is a brand-new, single-maintainer, unproven fork. There is no dedicated sparkline/microchart library in the npm ecosystem today that is both actively maintained AND has meaningful adoption AND has a modern React-first API (hooks, TS, tree-shaking, accessibility). Chartist and frappe-charts are the closest "alive" projects but they are general small-chart libraries, not sparkline/microchart-scoped, and neither is React-native.

Sources: [react-sparklines npm](https://www.npmjs.com/package/react-sparklines), [react-sparklines GitHub issues](https://github.com/borisyankov/react-sparklines/issues), [react-sparklines issue #133](https://github.com/borisyankov/react-sparklines/issues/133), [Lueton/react-sparklines](https://github.com/Lueton/react-sparklines), [@lueton/react-sparklines npm](https://www.npmjs.com/package/@lueton/react-sparklines), [fnando/sparkline GitHub](https://github.com/fnando/sparkline), [@fnando/sparkline npm](https://www.npmjs.com/package/@fnando/sparkline), [jquery-sparkline npm](https://www.npmjs.com/package/jquery-sparkline), [chartist-js/chartist GitHub](https://github.com/chartist-js/chartist), [chartist npm](https://www.npmjs.com/package/chartist), [frappe-charts npm](https://www.npmjs.com/package/frappe-charts), [miriyas/react-microcharts GitHub](https://github.com/miriyas/react-microcharts), [KyleAMathews/react-micro-bar-chart](https://github.com/KyleAMathews/react-micro-bar-chart), npm registry API (live query), Bundlephobia API (live query).

---

## 2. Big/General Chart Libraries Used for Sparklines

| Library | Weekly downloads | Gzip size (Bundlephobia) | Deps | Why overkill/poor fit for microcharts | Sparkline-specific offering |
|---|---|---|---|---|---|
| **Recharts** | 51,256,120/wk (!) | 145 KB gz | 11 | Huge dependency footprint for a single inline chart; built on D3 sub-modules + its own layout engine; API requires composing `<ResponsiveContainer>`, `<LineChart>`, `<Line>`, etc. — heavyweight ceremony for what should be a single `<Sparkline data={...} />` call; not designed for rendering dozens/hundreds of instances per page (e.g., one per table row) without real perf cost. | No dedicated sparkline component; shadcn/ui's chart recipes (built on Recharts) show a "mini" pattern but it's just a `LineChart` with axes/tooltips hidden via props, not a first-class microchart primitive. |
| **Victory** | 384,639/wk | 108 KB gz | 27 (!) | 27 transitive dependencies is extreme for a chart library, let alone an inline sparkline; heavy component-composition API (`VictoryChart`, `VictoryLine`, `VictoryAxis`, etc.); designed for full analytical charts and cross-platform (web+native) parity, not word-sized inline use. | No sparkline-specific component; `VictoryLine` can be stripped of axes but still carries the full Victory rendering pipeline overhead. |
| **Nivo** (`@nivo/core` + `@nivo/line`) | 1,501,724/wk (core) + 883,239/wk (line) | ~500KB+ for full install (per third-party comparison, ~approx) | many (modular but each chart type adds its own subpkg + d3 deps) | Designed explicitly for large, richly-annotated, server-renderable charts (30+ chart types); requires pulling in a specific `@nivo/X` package per chart type; not meant to be instantiated dozens of times inline. | No sparkline primitive; smallest option is `@nivo/line` with interactivity/axes disabled, still carries the full Nivo theming/motion engine. |
| **Chart.js** | 12,583,412/wk | 68.4 KB gz | 1 | Canvas-based, imperative API wrapped by non-React `chart.js` core (React usage needs `react-chartjs-2` on top); single per-page `<canvas>` re-render/destroy lifecycle management is awkward for many small independent inline charts; designed around one big canvas, not N tiny ones. | No sparkline component; commonly hand-rolled by disabling axes/legend/tooltip on a `line` chart type — well-documented pattern but DIY. |
| **ECharts** | 3,577,574/wk | 368 KB gz (!) | 2 | Largest bundle of the group by far; enterprise/analytics-grade feature set (3D, geo maps, large-data rendering) is wildly disproportionate to an inline word-sized chart use case. | Ships an explicit "sparkline" pattern via minimal-config `line` charts with `grid` and axes hidden, documented in ECharts examples, but the runtime cost is the full ECharts engine regardless. |
| **uPlot** | 351,495/wk | 21.9 KB gz | 0 | Actually reasonably small and canvas-based (fast), but API is very low-level/imperative (manual scale/series config), designed for time-series with potentially huge point counts — solving a different problem (perf at scale) than "pretty inline chart with minimal code." | No sparkline component; would need a thin wrapper to get a one-line "just give me a sparkline" API. |
| **Observable Plot** | 591,302/wk | 128 KB gz | 3 | Grammar-of-graphics API (`Plot.plot({...marks})`) is expressive but verbose for a one-off inline chart; designed for exploratory/analytical plotting and SSR-to-SVG generation, not tuned for embedding at word scale repeatedly in a UI. | No sparkline-specific helper; can produce a minimal line mark with axes suppressed, but still pulls in the full Plot grammar engine. |
| **lightweight-charts** (TradingView) | 769,442/wk | 61 KB gz | 1 | Purpose-built for full financial/trading charts (candlesticks, time scales, crosshairs); "lightweight" is relative to trading-chart competitors, not to sparkline scale; API/config overhead (chart instance, series, time scale) is unnecessary ceremony for a static inline trend indicator. | No sparkline primitive; some devs repurpose its `AreaSeries`/`LineSeries` minimal mode, but it's not marketed or optimized for that. |
| **Tremor** (`@tremor/react`) | 309,236/wk (current name); legacy `tremor` package only 547/wk | 222 KB gz | 7 | Tremor is a full dashboard component kit (KPI cards, full charts, layout primitives) built on top of Recharts internally — inherits Recharts' weight and adds its own styling layer on top; installing Tremor for "just a sparkline" pulls in the entire dashboard kit. | Ships pre-styled dashboard-ready chart components (area/bar/donut) that can be minimally configured to look sparkline-like, but no dedicated word-sized microchart primitive; still Recharts under the hood. |
| **shadcn/ui charts** | (distributed as copy-paste code, not a single npm package: `@shadcn/ui` meta-package itself only 88,778/wk and is not the charts) | inherits Recharts' 145 KB gz since built directly on Recharts | inherits Recharts' 11 | Not a library per se — copy-paste Recharts recipes into your repo; still fundamentally Recharts underneath with all the same weight/verbosity concerns, just skinned to match shadcn's design tokens. | No first-class sparkline block in the shadcn chart registry as of research date; community/registry sites (e.g. shadcn.io "53+ chart components") list ApexCharts-based sparkline recipes as a separate, non-official addition, not something shadcn/ui ships itself. |

**Overkill thesis is consistent across the category:** every general-purpose chart library's smallest realistic gzip footprint (Chart.js at ~68KB) is already 10-40x larger than a purpose-built sparkline needs to be (`@fnando/sparkline` is 1.6KB gzipped with zero deps), and none of them treat "many tiny inline instances per page" as a first-class use case — they're all optimized for one big chart per view.

Sources: npm registry API (live), Bundlephobia API (live), [PkgPulse Recharts v3 vs Tremor vs Nivo guide](https://www.pkgpulse.com/guides/recharts-v3-vs-tremor-vs-nivo-react-charting-2026), [LogRocket best React chart libraries 2026](https://blog.logrocket.com/best-react-chart-libraries-2026/), [shadcn-ui/ui Discussion #4133](https://github.com/shadcn-ui/ui/discussions/4133), [shadcn.io charts registry](https://www.shadcn.io/charts), [Querio top React chart libraries](https://querio.ai/articles/top-react-chart-libraries-data-visualization).

---

## 3. Design-System Microcharts

| Design system | Ships a sparkline/microchart component? | Details |
|---|---|---|
| **shadcn/ui** | No official first-class sparkline block (as of research date) | Chart recipes are Recharts-based copy-paste code (`ui.shadcn.com/charts`); third-party registries (shadcn.io) list ~53+ community chart components including ApexCharts-based sparkline/heatmap/treemap recipes, but these are not shadcn/ui itself. [Source](https://www.shadcn.io/charts), [ui.shadcn.com/charts/area](https://ui.shadcn.com/charts/area). |
| **Radix (Primitives)** | No | Radix is unstyled interaction primitives (dialogs, menus, etc.); it does not ship any charting or data-viz components at all. |
| **Mantine** | **Yes** — `Sparkline` component | Documented as "a simplified version of AreaChart" for single-series data in a small space; supports `w`/`h`, `data`, `curveType` (Bump/Linear/Natural/Monotone/Step variants), `color`, `fillOpacity`, `strokeWidth`, and a `trendColors` prop (positive/negative/neutral coloring). Built on Mantine Charts, which itself wraps **Recharts** internally. [Source](https://mantine.dev/charts/sparkline/). |
| **Chakra UI** | **Yes** — `Sparkline` composition | Chakra's charts docs show Sparkline examples (area/bar/line variants) built via `@chakra-ui/charts` primitives (`Chart`, `useChart`) directly on top of **Recharts** (`AreaChart`, `Area` imported from `recharts` in the docs examples). Supports gradients and reference lines. [Source](https://chakra-ui.com/docs/charts/sparkline). |
| **Ant Design** | Partial — not in core `antd`, but in the ecosystem | Core `antd` `Statistic` component is numbers-only, no built-in chart. The sibling library **Ant Design Charts** (`ant-design-charts`, built on AntV G2, 12,564 GitHub stars, actively pushed as of 2026-06-18) and **AntV GUI** ship dedicated `Sparkline` components — but this requires adding a separate, fairly heavy charting package (G2 ecosystem) alongside core antd, not a built-in of the design system itself. [Ant Design Charts GitHub](https://github.com/ant-design/ant-design-charts), [AntV GUI Sparkline docs](https://gui.antv.vision/en/docs/api/ui/sparkline/). |
| **IBM Carbon Design System** | Partial | Carbon documents "Simple charts" as a data-viz pattern category, and ships a separate **Carbon Charts** library (26 chart types across React/Vue/Angular/Svelte/vanilla) — 156.8 KB gz / 3 deps per Bundlephobia — but there is no dedicated word-sized sparkline/microchart primitive documented distinctly from its general chart set. [Carbon simple charts](https://carbondesignsystem.com/data-visualization/simple-charts/), [Carbon Charts docs](https://charts.carbondesignsystem.com/). |
| **Microsoft Fluent UI** | **Yes** — `SparklineChart` | `@fluentui/react-charting` (and its successor `fluentui-charting-contrib`, 28 stars, actively pushed as of 2026-07-05, 59 open issues) ships an explicit `SparklineChart` component, described as used across 100+ internal Microsoft projects (M365, Azure), WCAG 2.1 compliant, built on **D3** underneath. But it ships as part of the full `react-charting` package, not a standalone lightweight primitive. [Source](https://microsoft.github.io/fluentui-charting-contrib/docs/Charting-Concepts/SparklineChart). |
| **MUI (MUI X)** | **Yes** — `SparkLineChart` | Part of MUI X Charts; supports line/bar plot types, area fill, curve interpolation, optional tooltips/highlighting, theme-aware colors, SVG rendering. Positioned explicitly for "inline placement in tables, dashboards, or alongside text." [Source](https://mui.com/x/react-charts/sparkline/). |
| **KendoReact (Telerik)** | **Yes** — `Sparkline` | Commercial component library; documented as "a tiny chart without axes, coordinates, legends, titles" — distributed via `kendo-react-charts` package (paid/commercial license). [Source](https://www.telerik.com/kendo-react-ui/components/charts/sparkline). |
| **AG Grid** | **Yes** — Sparklines feature | AG Grid (data-grid product, Enterprise feature) ships built-in cell-level sparklines specifically for grid/table use cases. [Source](https://www.ag-grid.com/react-data-grid/sparklines-overview/). |

**Pattern across design systems:** Sparkline/microchart support does exist in several systems (Mantine, Chakra, MUI X, Fluent, Kendo, AG Grid), which validates strong demand — but every single one of them either (a) is a thin wrapper on top of a heavyweight general chart engine they already ship (Recharts for Mantine/Chakra, D3 for Fluent), meaning you can't get "just the sparkline" without the parent library's bundle cost, or (b) is gated behind a commercial license (Kendo, AG Grid Enterprise), or (c) is missing entirely from the most-hyped modern stack (shadcn/ui + Radix, the pairing most new React devs reach for in 2026).

### SaaS dashboards' actual practice (inline table-cell sparklines)

- **Grafana**: Table panels have a native built-in "Sparkline" cell display mode (not a separate reusable open-source component — it's baked into Grafana's own table panel renderer). Multiple open GitHub issues show rough edges: min/max values ignored ([#79334](https://github.com/grafana/grafana/issues/79334)), missing data-link support ([#81295](https://github.com/grafana/grafana/issues/81295)), "no value" handling bugs ([#75352](https://github.com/grafana/grafana/issues/75352)), and sparklines failing to render when any row has empty data via PromQL ([#81527](https://github.com/grafana/grafana/issues/81527)) — i.e., even a well-resourced, purpose-built internal implementation has ongoing edge-case bugs, suggesting this is a genuinely fiddly problem space, not a solved one.
- **Stripe dashboard**: KPI cards pattern combines a big number + trend delta + inline sparkline (per third-party dashboard-pattern analyses); no public engineering post found describing their specific charting implementation (likely proprietary/internal).
- **Linear, Vercel**: No public engineering blog post or open-source repo found describing their specific inline sparkline implementation; both are closed-source products, so implementation details aren't independently verifiable — noted as a gap in available public source material, not a confirmed absence of sparklines in their UI.
- **Datadog**: No public open-source component found for their table-cell sparklines specifically (Datadog's frontend is closed-source); only third-party Grafana↔Datadog datasource plugins surfaced, which are unrelated to the charting layer itself.

Sources: [Mantine Sparkline](https://mantine.dev/charts/sparkline/), [Chakra UI Sparkline](https://chakra-ui.com/docs/charts/sparkline), [Ant Design Charts GitHub](https://github.com/ant-design/ant-design-charts), [AntV GUI Sparkline](https://gui.antv.vision/en/docs/api/ui/sparkline/), [Carbon simple charts](https://carbondesignsystem.com/data-visualization/simple-charts/), [Carbon Charts](https://charts.carbondesignsystem.com/), [Fluent SparklineChart docs](https://microsoft.github.io/fluentui-charting-contrib/docs/Charting-Concepts/SparklineChart), [Fluent charting discussion #28014](https://github.com/microsoft/fluentui/discussions/28014), [MUI X Sparkline](https://mui.com/x/react-charts/sparkline/), [KendoReact Sparkline](https://www.telerik.com/kendo-react-ui/components/charts/sparkline), [AG Grid Sparklines](https://www.ag-grid.com/react-data-grid/sparklines-overview/), [Grafana table panel issues #79334](https://github.com/grafana/grafana/issues/79334), [#81295](https://github.com/grafana/grafana/issues/81295), [#75352](https://github.com/grafana/grafana/issues/75352), [#81527](https://github.com/grafana/grafana/issues/81527), [Grafana table docs](https://grafana.com/docs/grafana/latest/panels-visualizations/visualizations/table/).

---

## 4. Developer Pain Points (quotes + links)

1. **react-sparklines maintenance is a known dead end, acknowledged by its own community.** GitHub issue [#133 "Is this still being mantained?"](https://github.com/borisyankov/react-sparklines/issues/133) (opened 2020-12-12 by a user offering to help maintain it):
   > "I'm working on a project where I'm using react-sparklines and I loved the simplicity of it. But I've noticed that some old PRs are still opened and asked myself if it's still being maintained. I have some free time to help with it if needed. @borisyankov please let me know if you need any help."

   No maintainer response. Two years later (2022-11-03), user `matt-d-webb` commented:
   > "I guess that answers that question 😆 #twoyears"

   Another user, `dmackerman` (2023-09-28):
   > "Yeah, shame. Still using this in production and its quite nice."

   Finally, in 2025-02-18, user `Lueton` announced a fork:
   > "I hope this is appropriate, but since i was using this unmaintained package too back then i made my own implementation [lueton@react-sparklines] a while ago. The API is quite similar."

   This is a five-year-old open issue where the eventual "resolution" was a third party quietly forking the library rather than the original ever being fixed — a direct, dated illustration of the abandonment problem, and evidence that people are still shipping the dead package to production in 2023+ for lack of a better option.

2. **Grafana's own built-in sparkline cell type still has active, unresolved bugs** years into its existence — [#79334](https://github.com/grafana/grafana/issues/79334) (min/max ignored), [#81295](https://github.com/grafana/grafana/issues/81295) (no data-link support), [#75352](https://github.com/grafana/grafana/issues/75352) (no-value handling), [#81527](https://github.com/grafana/grafana/issues/81527) (rendering fails on any empty row) — suggesting that even a well-funded team building sparklines for their own first-party use case still has edge-case gaps (empty data, min/max clamping, interactivity), which a well-designed general-purpose library could differentiate on.

3. **shadcn/ui's own community discussion on chart libraries ([Discussion #4133](https://github.com/shadcn-ui/ui/discussions/4133))** shows developers converging repeatedly on the same handful of heavyweight options (Recharts, Tremor, ApexCharts, Nivo, ECharts, Ant Charts) with no one proposing a sparkline-first alternative — implying the lightweight option simply isn't on anyone's radar as a candidate, not that it was considered and rejected.

4. **Bundle-size-vs-scope mismatch is implicit across every comparison source found**: multiple 2026 guides (PkgPulse, LogRocket, Querio) independently frame the core React charting decision as "which large chart library" (Recharts vs Tremor vs Nivo vs ECharts), never "which sparkline library" — the market discourse doesn't even have a distinct category/vocabulary for "microchart library" the way it does for "chart library," which itself signals whitespace (no established leader to even benchmark against in casual dev discourse).

5. Direct Reddit/HN threads specifically complaining "react-sparklines is abandoned" were not found via search (Reddit's search surface didn't return old r/reactjs threads, and Hacker News had no dedicated discussion of the library). This is itself informative: the complaint pattern isn't a viral HN pile-on — it is quieter, diffuse, script-kiddie-style, showing up as forks/one-off GitHub issues rather than public discourse. Treat the "GitHub issue as the site of complaint" pattern (item 1 above) as the strongest available direct evidence rather than claiming a HN/Reddit groundswell that could not be verified.

---

## 5. Whitespace Analysis

Based on the above, here is what specifically does **not** exist in the React microchart space as of July 2026:

1. **No actively-maintained, standalone, React-first sparkline library with real adoption.** The most-downloaded dedicated option (`react-sparklines`, 212,974/wk) has had no functional commit since 2020 and no release since 2017. Its only "actively maintained" alternative (`@lueton/react-sparklines`) is a brand-new single-maintainer fork with 10 GitHub stars — unproven, and by the maintainer's own account created simply to escape the dead original, not because it advances the API. There is a real, provable gap between "what's downloaded" and "what's maintained."

2. **No zero/near-zero-dependency sparkline suite that is also idiomatic modern React** (hooks-based, TS-first, tree-shakeable per-chart-type, SSR/RSC-safe). The genuinely tiny options (`@fnando/sparkline` at 1.6KB gz, 0 deps) are vanilla-JS/imperative-DOM libraries with no React bindings at all — using them in React means hand-wiring `useRef`/`useEffect` yourself. The React-native option (`react-sparklines`) does have a small footprint (6.6KB gz) but is dead code with no TS types in the base package and no modern React idioms.

3. **No library treats "many instances per page" as the core design constraint.** Every general-purpose chart library (Recharts, Victory, Nivo, ECharts, Tremor, Chart.js) is architected around "one big chart per view" — none of their docs, benchmarks, or marketing address the specific perf/ergonomics problem of rendering 50-500 tiny independent charts on one screen (a data table with a sparkline per row, a dashboard grid of KPI cards, a list of tickers). This is a materially different engineering problem (render cost amortization, shared scale/gradient defs, minimal SVG node count per instance, avoiding per-instance ResizeObserver/layout thrash) that nothing currently optimizes for explicitly.

4. **No accessible sparkline/microchart primitive exists as a standalone package.** None of the dedicated sparkline libraries found (react-sparklines, @fnando/sparkline, jquery-sparkline, peity) mention ARIA roles, text alternatives, or screen-reader support in their docs. The design-system versions that do care about accessibility (Fluent's WCAG 2.1-compliant SparklineChart) bundle it inside a full D3-based charting package you can't use standalone — accessibility and minimalism have not been solved together in one place.

5. **No consistent, unified API across chart "shapes" for the word-sized use case.** Sparkline (line), bar-sparkline/"spark column," win/loss indicator, bullet/progress micro-bar, tiny donut/ring, trend badge (up/down arrow + delta) are all commonly needed in the same dashboard/table context, but no library offers them as one coherent, consistently-themed component family at microchart scale — currently a team must combine, e.g., Mantine's Sparkline (line only, Recharts-backed) with a hand-rolled badge component with a hand-rolled mini-bar, from three different visual languages.

6. **Design-system sparkline support exists but is always a "tax" on adopting the parent chart engine.** Mantine's Sparkline and Chakra's Sparkline both require pulling in Recharts (145KB gz) as a transitive dependency just to render a 20px-tall inline trend line; Fluent's SparklineChart requires the D3-based `react-charting` package. There is no "just the sparkline, nothing else" option even inside the design systems that advertise one.

7. **shadcn/ui + Radix — arguably the dominant modern React UI stack in 2026 — has no first-party microchart story at all.** shadcn's official chart offering is Recharts-based copy-paste recipes for full-size charts; the closest thing to a sparkline in that ecosystem is third-party community registries wrapping ApexCharts (613KB gz, per Bundlephobia). Given shadcn/ui's popularity and its explicit "copy the code, own it" philosophy, a small, copy-paste-friendly (or npm-installable) microchart primitive matching shadcn's design-token conventions is a clearly open slot.

8. **Commercial-only sparklines gate a real feature behind paywalls.** Kendo React's Sparkline and AG Grid's cell sparklines are both commercial/Enterprise-tier features — meaning teams that want a polished, well-supported inline chart today either accept a dead free library, build one themselves on top of a general chart engine (accepting its bundle cost), or pay for a commercial grid/component suite. This is a viable-looking business gap for a free/open-source option that's actually good.

**Net whitespace statement:** There is no free, open-source, actively-maintained, dependency-light, React-idiomatic (hooks/TS/RSC-safe), accessible library that provides a consistent family of word/cell-sized chart primitives (line sparkline, bar sparkline, win/loss, bullet/progress micro-bar, trend badge) optimized for rendering many instances per view. The demand signal is strong and provable (react-sparklines' 212K/wk downloads despite a decade of dormancy; sparkline components independently reinvented inside Mantine, Chakra, MUI X, Fluent, Kendo, and AG Grid; Grafana building and still debugging its own native version), but every existing supply-side answer is either dead, a thin re-skin of a 100KB+ general chart engine, commercial-only, or missing the React-native/accessibility/many-instances requirements simultaneously. That combination — small, modern, accessible, multi-shape, free, and genuinely maintained — is the open slot.

---

## Appendix: Raw npm weekly download snapshot (2026-06-28 to 2026-07-04, via api.npmjs.org)

| Package | Weekly downloads |
|---|---|
| react (baseline reference) | 612,150,477 (last 30 days) |
| recharts | 51,256,120 |
| chart.js | 12,583,412 |
| echarts | 3,577,574 |
| @nivo/core | 1,501,724 |
| apexcharts | 1,886,211 |
| @nivo/line | 883,239 |
| lightweight-charts | 769,442 |
| @observablehq/plot | 591,302 |
| victory | 384,639 |
| @visx/xychart | 378,451 |
| uplot | 351,495 |
| @tremor/react | 309,236 |
| react-sparklines | 212,974 |
| jquery-sparkline | 33,617 |
| sparkline (bare "spark" pkg) | 63,559 |
| frappe-charts | 59,456 |
| chartist | 103,049 |
| @fnando/sparkline | 6,950 |
| peity | 10,047 |
| @shadcn/ui (meta pkg) | 88,778 |
| tremor (legacy pkg name) | 547 |
| @visx/visx | 79,346 |
| react-vis | 83,245 |
| react-microcharts | ~1 |

## Appendix: Bundlephobia gzip sizes (live query, 2026-07-06)

| Package | Gzip | Uncompressed | Dependency count |
|---|---|---|---|
| recharts | 145.05 KB | 554.24 KB | 11 |
| victory | 107.76 KB | 358.59 KB | 27 |
| chart.js | 68.40 KB | 200.82 KB | 1 |
| echarts | 367.96 KB | 1114.83 KB | 2 |
| uplot | 21.86 KB | 50.83 KB | 0 |
| @observablehq/plot | 127.96 KB | 384.51 KB | 3 |
| lightweight-charts | 61.00 KB | 190.74 KB | 1 |
| chartist | 19.83 KB | 37.09 KB | 0 |
| react-sparklines | 6.59 KB | 27.66 KB | 1 |
| @fnando/sparkline | 1.59 KB | 3.58 KB | 0 |
| @tremor/react | 222.49 KB | 819.72 KB | 7 |
| apexcharts | 167.88 KB | 613.93 KB | 0 |
| @carbon/charts-react | 156.77 KB | 549.24 KB | 3 |
