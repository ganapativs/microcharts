# 01 — Research Findings (July 2026)

> Status: complete · Method: live npm registry + Bundlephobia API queries, GitHub API metadata, primary-source doc fetches, web search. Key figures verified 2026-07-06.

## 1. The dedicated sparkline category is dead

| Library | Last publish | Weekly downloads | Gzip | Deps | Status |
|---|---|---|---|---|---|
| react-sparklines | **2017** | 212,974 | 6.6 kB | 1 | Abandoned. Issue #133 "Is this still maintained?" open 5 years; resolved only by a 3rd-party fork |
| @lueton/react-sparklines (fork) | ~2026 | negligible | — | — | Solo hobby fork, 10 stars, unproven |
| @fnando/sparkline | 2018 (commits to 2023) | 6,950 | **1.6 kB** | **0** | Vanilla JS, no React bindings, no a11y, stalled |
| jquery-sparkline | 2016 | 33,617 | — | jQuery | Dead, jQuery-era |
| peity | 2018 | 10,047 | — | jQuery-adjacent | Dead |
| chartist (revived) | 2025 | 103,049 | 19.8 kB | 0 | Alive but general-purpose, not React-native, not micro-scoped |
| frappe-charts | 2021 | 59,456 | — | 0 | Stalled |

**The demand proof:** react-sparklines still pulls 213k downloads/week despite a decade of dormancy. People ship dead code to production for lack of a better option (documented in its own issues: "Still using this in production and its quite nice" — 2023).

## 2. Big chart libraries are 10–230× oversized for the job

| Library | Weekly downloads | Gzip | Deps | Sparkline story |
|---|---|---|---|---|
| Recharts | 51.3M | 145 kB | 11 | none; hide-the-axes DIY |
| Chart.js | 12.6M | 68 kB | 1 | none; DIY pattern |
| ECharts | 3.6M | 368 kB | 2 | minimal-config line, full engine cost |
| Nivo | 1.5M (core) | ~500 kB full | many | none |
| Victory | 385k | 108 kB | **27** | none |
| uPlot | 351k | 21.9 kB | 0 | none; low-level imperative API |
| Tremor | 309k | 222 kB | 7 | Recharts inside |
| Observable Plot | 591k | 128 kB | 3 | none |

None treats "hundreds of tiny instances per page" as a design constraint; all optimize for one big chart per view. Reference point: @fnando/sparkline proves the job is doable in 1.6 kB / 0 deps.

## 3. Design systems keep reinventing sparklines — always with a tax

- **Mantine, Chakra**: Sparkline components that are thin wrappers over Recharts (145 kB transitive tax).
- **MUI X**: `SparkLineChart`, part of MUI X Charts suite.
- **Fluent UI**: `SparklineChart`, D3-based, WCAG 2.1 — but only inside the full react-charting package.
- **Kendo, AG Grid**: sparklines behind commercial licenses.
- **shadcn/ui + Radix (the dominant 2026 stack): zero first-party microchart story.** Chart recipes = Recharts copy-paste; community sparkline recipes wrap ApexCharts (168 kB).
- **Grafana**'s own native table sparkline cell has years-old open bugs (min/max ignored #79334, empty-data render failures #81527) — even well-resourced teams find micro rendering fiddly.

Six independent design systems reinventing the same component = strong demand signal. Zero of them solve small + accessible + standalone simultaneously.

## 4. Accessibility: the entire ecosystem fails, citably

- **shadcn charts**: a11y docs = two sentences + `accessibilityLayer` prop. Independent audit (Ashlee Boyer): "No information is presented about the data by a screen reader… charts do not have a text alternative… color is currently the only way to distinguish data." Concrete WCAG failures: 1.1.1, 1.3.1, 1.4.1, 1.4.13. VoiceOver unsupported by Recharts' own wiki admission.
- **Observable Plot**: zero auto-generated data descriptions; only structural mark-type labels ("dot", "y-axis") + empty-by-default manual ARIA attributes.
- **Highcharts** (the gold standard): information region + per-point arrow-key navigation + sonification — but its text pipeline emits only structural boilerplate (type, series count, point count, raw min/max). **It explicitly delegates trend perception to audio.** No chart library anywhere auto-generates a natural-language trend sentence ("trending up 12%, range 3–18").
- Dedicated sparkline libs: no ARIA at all, none of them.

**→ Auto-generated data summaries are a genuine first.** Academic prior art exists to build on (arXiv 2110.04406 four-level semantic model; SAS Graphics Accelerator; Fizz Studio Chartability heuristics).

## 5. Technical architecture findings (full detail → 03/07)

- **SVG wins at micro scale**: cost scales with node count; a sparkline is 1–5 nodes. 500 instances ≈ 1,000 nodes — well under the ~1,500-node Lighthouse warning and ~3–5k SVG comfort ceiling. Canvas needed only past thousands (Felt, Glide Data Grid migrations happened at *thousands*, with per-frame scroll churn).
- **No RSC-native chart library exists in 2026.** A hook-free static sparkline rendering pure SVG server-side with zero client JS is an open differentiator.
- **Container queries for chart adaptivity: no chart library does this yet.** Another open slot.
- **WASM: firmly no.** Boundary-call overhead ≥ the entire scale+path math for ≤ a few hundred points. "WASM is write-once, not performance" is 2026 consensus.
- Animation: CSS `d: path()` has **no Safari support** — use WAAPI + stroke-dashoffset + transform/opacity; closed-form spring in <1 kB if needed.
- Viewbox + `preserveAspectRatio` + `vector-effect: non-scaling-stroke` = responsive without ResizeObserver (Rich Harris/Pancake technique).

## 6. OSS engineering findings (full detail → 09/11)

- **Changesets** = 2026 monorepo versioning standard (3–3.5M downloads/wk, beats semantic-release; used by Astro/SvelteKit/Chakra/pnpm).
- **npm trusted publishing (OIDC)** GA since July 2025, auto-provenance; post-Shai-Hulud-worm era makes it table stakes. npm v12 disables install scripts by default (~July 2026).
- **publint + arethetypeswrong** in CI = standard package-correctness pairing.
- **Visual regression**: Lost Pixel is dead (acquired by Figma, sunset April 2026). Recommended: Playwright `toHaveScreenshot()` in pinned Docker + Argos CI free tier for PR review. Avoid whole-markup SVG snapshots (brittle); assert on normalized path data + small tolerant pixel layer.
- **License**: MIT (10 of 13 peer libraries; Apache-2.0 outliers all have institutional reasons we don't have).
- **Contributor Covenant 3.0** (July 2025) current; CC BY-SA 4.0.
- **Renovate** over Dependabot for a small monorepo (workspace-aware grouping, built-in automerge, dependency dashboard).
- **Launch playbook**: Show HN with one falsifiable number (uPlot precedent), live no-signup demo, shadcn-style copy-paste CLI as second distribution mode, llms.txt at launch (cheap; lightweight-charts users are asking for it), dev.to writeup, awesome-lists. X/Twitter deprioritized (engagement −48% YoY).

## 7. Aesthetic findings (full detail → 06)

Vercel/Linear/Stripe token-level analysis: near-neutral base + one semantic accent, hairline strokes (1–1.5 px), radius on containers not data, transparent chart canvas, tabular-nums mandatory next to charts, 150–250 ms ease-out motion on data change only. shadcn theming lesson: CSS variables at low specificity; Tremor lesson: don't couple theming to Tailwind config.
