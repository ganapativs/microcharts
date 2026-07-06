# 10 — Roadmap: Step-by-Step Execution

> Status: draft v1 · Structured so each step is independently executable and testable ("test the waters" checkpoints marked ✋).
> Effort labels are rough solo-dev calendar time with AI-assisted development.

## Phase 0 — Foundations (≈ 2–4 days)

**0.1 Name & identity.** Check npm/GitHub availability for `microcharts` (likely taken — candidates: `microcharts`, `@microcharts/react`, or a distinct brand name). Decide scope-free brand early; register npm name + GitHub org + docs domain.
**0.2 Repo scaffold.** Single package + pnpm; TypeScript strict; tsdown (tsup fallback if rough edges); ESM-only; exports map skeleton; MIT license; Contributor Covenant 3.0; CONTRIBUTING.md (≤1,500 words, Conventional Commits); `.github/` health files.
**0.3 CI skeleton.** GitHub Actions: typecheck/lint/test matrix (React 18/19 × Node 20/22/24), size-limit, publint+attw, zero-dep check. Renovate config. npm trusted publishing (OIDC) wired to a release workflow; changesets init.
**0.4 Quality scaffolding.** Vitest **two-project config** — (a) node/jsdom for core math + static SVG attribute assertions, (b) `@vitest/browser` (Playwright provider) + `vitest-browser-react` for interactive entries needing real SVG layout (`getBBox`/`getScreenCTM` are 0 in jsdom); RTL + fast-check; Playwright + Docker visual baseline job; Argos hookup; axe-core harness; **knip** (unused deps/exports/files) wired as a CI gate; fixture apps (Next RSC + Vite).

✋ **Checkpoint 0**: empty-but-green pipeline; `npm publish --dry-run` passes publint/attw.

## Phase 1 — Core kernel (≈ 1 week)

**1.1** `core/scale.ts`, `core/path.ts` (linear/smooth/step/area), `core/stats.ts`, `core/bank.ts` — pure, property-tested.
**1.2** `core/summary.ts` — describeSeries for S1 + S4 shapes, en templates, Intl formatting.
**1.3** `shared/Chart.tsx` root wrapper (viewBox, role=img, aria composition, token plumbing) + `styles.css` (tokens via `:where()`, reduced-motion / forced-colors / prefers-contrast blocks).
**1.4** Theming: token set, `presets.{modern,tufte,mono,vivid}`, `MicroProvider` + `data-mc-theme`.

✋ **Checkpoint 1**: a hand-assembled sparkline renders crisp, themed, SSR-static in the Next fixture with zero client JS.

## Phase 2 — The proving five (≈ 3–4 weeks)

Order: **2.1 `<Sparkline>`** (line/smooth/step, fill, band, dots, labels, annotations layer) → **2.2 `<SparkBar>`** (+ win-loss) → **2.3 `<Delta>`** → **2.4 `<Bullet>`** → **2.5 `<ActivityGrid>`**.
Each lands per the Definition of Done in `09-testing-quality.md` (a11y, budgets, visuals, docs fixtures, bench).
**2.6** Interactive entries (hover, keyboard, live) for Sparkline + SparkBar. **2.7** `SparkGroup` shared scale. **2.8** Bench suite v1 (us vs Recharts/Chart.js/MUI X/uPlot/@fnando).

✋ **Checkpoint 2 — "test the waters" demo**: private demo page: a data table with 500 sparkline rows, KPI card row, inline-prose sparks. Judge: does it _feel_ handcrafted? Are numbers (size/perf) hitting budgets? Iterate design here before any public move.

## Phase 3 — Docs & polish (≈ 2 weeks)

**3.1** **Fumadocs** docs site (fumadocs-ui 16.10+, verified active weekly releases 2026-07; React/Next-native — deliberate reversal of the earlier Starlight/Astro pick). Rationale: microcharts + live-prop editors ARE React, so a React-native docs runtime makes live "edit props → see chart" demos first-class with **no Astro-island bridge** (the bridge friction is what made Sandpack fragile), and the default theme is the most modern/delightful out of box in 2026 — matching the brand bar. Trade-off accepted: ships more client JS than Astro, but **docs-site JS ≠ library bundle**, so the zero-dep/size gates are untouched. Live examples = Shiki highlighting (inherited from `fumadocs-core`, no standalone pin) + real components rendered inline — NOT Sandpack (verified stale, in-browser bundler unneeded; StackBlitz SDK is the fallback if full editing is ever wanted). Landing = hero + one falsifiable number + live demo above the fold; full gallery one click away (verified: peer libs don't do gallery-first landings). The 4-contexts pattern on every chart page. **Storybook 10** (Vite builder, verified very active 2026-07) is the local component workshop — replaces Ladle (5.1.1, went sleepy: no release since 2025-11). Storybook earns the weight here: a11y addon maps to the axe DoD, theme/background/viewport toggles cover the light/dark × 5-preset matrix out of box (hundreds of chart variants to eyeball), and Chromatic/Argos visual-regression is first-class. The self-rendering `chart-gallery.html` retires into a Storybook story once the workshop exists.
**3.2** Accessibility page + screen-reader demo recording. Theming guide. "Which microchart?" chooser. Short "design notes" page (why defaults look the way they do) — principles applied silently; external docs/marketing never lecture about Tufte or cite theory. The craft shows, it doesn't preach.
**3.3** llms.txt + markdown docs mirror. GitHub topics. README with the falsifiable-number pitch + comparison table (size/deps/a11y receipts vs react-sparklines/Recharts).
**3.4** `v0.x` releases to npm throughout (changesets), provenance on.

✋ **Checkpoint 3**: 3–5 friendly devs try it cold; watch where they stumble; fix API paper cuts. API freeze for 1.0 surface.

## Phase 4 — Launch (≈ 1 week, timed)

**4.1** `1.0.0`. **4.2** Show HN (Tue–Thu 8–10am ET; title = the number; link = live no-signup demo; first comment = honest "why I built it" + limitations). **4.3** dev.to engineering writeup ("making sparklines screen-reader accessible" angle). **4.4** This Week in React / React Status submissions; awesome-list PRs; r/reactjs (verify self-promo rules first). **4.5** Product Hunt as credibility echo, low investment.

## Phase 5 — Catalog buildout (v1.x → v2, ≈ 1 quarter, demand-ordered)

**5.1** Trend family completion: Band variant polish, Seismogram, HistogramStrip, RugStrip, HeatStrip.
**5.2** Categorical: MiniBar, DotPlot, PairedBars, Slope, MicroBox (+ Lollipop).
**5.3** Part-to-whole: Progress, SegmentedBar, ProgressRing (MicroDonut later, `decorative` subpath).
**5.4** Scalar: HeatCell, StatusDot, TrendArrow.
**5.5** shadcn-style copy-paste CLI (`npx microcharts add sparkline`) + registry entry.
**5.6** Community: good-first-issues, preset gallery, locale contributions for summaries.

## Phase 5b — Universal rendering & AI-native (parallel track, v1.x; see `13`/`14`)

**5b.1** Client export: `microcharts/export` — toSVG (computed-style inlining), toPNG (scale/DPI), toClipboard, toDataURI. Zero-dep.
**5b.2** String renderer `microcharts/string` (React-free SVG strings) + Unicode renderer `microcharts/text`.
**5b.3** Chart spec + JSON Schema + `<MicroChart spec>` + partial-JSON streaming parser + `<StreamingMicroChart>`.
**5b.4** Markdown integrations: streamdown recipe, react-markdown recipe, `rehype-microcharts` build-time plugin.
**5b.5** Context presets: `newspaper`, `magazine`, `poster`, `eink`, `print` + print.css + physical-sizing docs.
**5b.6** Font-fidelity export tiers: `system`/`embed` (zero-dep); optional `@microcharts/outline` (opentype.js 2.0, verified active) as separate package.
**5b.7** Chart-as-URL edge-function template + README badge dogfood (our repo wears its own sparkline badges); server PNG recipe via sharp (verified active).
**5b.8** `examples/mcp-server` (~50-line spec→SVG tool).

Sequencing note: 5b.1–5b.3 can start immediately after Checkpoint 2 (they only need the v1 five + string renderer); a slice (toSVG/toPNG + spec + streamdown recipe) is worth pulling INTO the launch if timing allows — export + AI-streaming are launch-post differentiators.

## Phase 5b′ — Decision micrographs (v1.x–v2, core package; see `16`)

Research-grounded uncertainty/comparison/trust types, prioritized by evidence strength: QuantileDots + GradedBand + BenchmarkStrip first (strongest research + simplest), then ForecastCone, ControlStrip, ErrorBudget, BurnChart, RetentionCurve, remaining Q-types demand-driven. These ship in core — they're workhorses, and "the only library with honest uncertainty at inline scale" is a second Show-HN-grade story.

## Phase 5c′ — Frontier collection (v2.x, core + `@microcharts/expressive` split per type; see `17`)

Flagships by usage breadth: TapeGauge, TokenConfidence, TimeInRange, Waveform, Hypnogram, TraceFold (observability audiences), CalibrationStrip (ML audiences). StationGlyph = the halo/marketing piece ("the 1941 chart no library ever shipped"). Decision additions Q19 CyclePlot / Q20 ParetoStrip ride with the decision-micrograph track. Refinements land earlier: fading-edge bands into Q3/band-sparkline, micro-HOP into Q4 interactive, sweep mode on ProgressRing, pattern-fill second channel with the forced-colors work.

## Phase 5c — Expressive collection (v2.x, `@microcharts/expressive`; see `15`)

Flagships first: MoonPhase, HeartbeatBlip, TreeRings, TallyMarks, PolarClock, CitySkyline, FillWord, ConfettiBurst — then demand-driven from the remaining 27. Same grammar/tokens/a11y/budgets; every type ships with its documented encoding channel and precision rating. This is the "nobody else has anything like this" tier — launch-post material for a second wave of attention.

## Phase 6 — Horizon (only on traction)

Canvas shared-surface renderer for virtualized-grid extremes · vanilla-JS wrapper from `core/` · Unicode/ASCII renderer (`▁▂▄▇` — inline spark token for exports) · sonification exploration (Highcharts/Apple prior art) · native ports **only** if the web library clearly succeeds.

## Standing cadence

- Weekly: Renovate merges, triage, bench trend review.
- Per release: SR manual pass, visual approvals, changelog via changesets.
- Quarterly: roadmap review against adoption data; kill/keep decisions for horizon items.

## Success gates (from `00-vision.md`)

v1 ships 5 charts under budget with 0 deps → launch metrics (HN reception, first external adopters) → decide v2 catalog pace → 12-month target: 1k stars or one recognizable product using it in production tables.
