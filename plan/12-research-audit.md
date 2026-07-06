# 12 — Research Provenance Audit

> Written 2026-07-06 after a dedicated verification round. Classifies every load-bearing claim in the plan.
> **CONFIRMED** = primary source fetched/queried directly (npm registry API, W3C/MDN/react.dev text, GitHub API, Bundlephobia API).
> **CORROBORATED** = multiple independent secondary sources agree; primary not directly fetched.
> **FLAGGED** = knowledge-based, single-source, or self-flagged by the researching agent; treated as assumption, not fact.
> Corrections from the verification round are marked ⚠ and already patched into the docs.

## Market & whitespace (01, 02)

| Claim                                                                                        | Status                                                                    |
| -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| react-sparklines: 212,974 dl/wk, last publish 2017, abandoned (issue #133 timeline)          | CONFIRMED (live npm API + GitHub)                                         |
| All bundle sizes/dep counts (Recharts 145 kB/11 deps, @fnando 1.6 kB/0, uPlot 21.9 kB, etc.) | CONFIRMED (live Bundlephobia API)                                         |
| Design-system sparklines (Mantine/Chakra wrap Recharts; MUI X, Fluent, Kendo, AG Grid exist) | CONFIRMED (official docs fetched)                                         |
| shadcn/Radix has no first-party microchart                                                   | CONFIRMED (registry + discussion #4133)                                   |
| Grafana sparkline-cell open bugs                                                             | CONFIRMED (4 linked issues)                                               |
| Stripe/Linear/Datadog table-cell implementation details                                      | FLAGGED (closed-source; used only as pattern inspiration, no claims made) |
| No "viral complaint groundswell" on HN/Reddit — complaints are diffuse GitHub-issue-level    | CONFIRMED (searched; absence honestly reported)                           |

## Accessibility (08)

| Claim                                                                                                                | Status                                                                                                                                          |
| -------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| shadcn/Recharts a11y failures (WCAG 1.1.1/1.3.1/1.4.1/1.4.13; VoiceOver unsupported)                                 | CONFIRMED (docs fetched 2×, Recharts wiki, independent audit, upstream issues)                                                                  |
| No library auto-generates NL data summaries (Highcharts/Chart.js/Plot/ECharts checked individually)                  | CONFIRMED (each ecosystem exhaustively fetched: Highcharts default templates quoted, Chart.js docs+issue #1976, Plot PR #710, plugin ecosystem) |
| Highcharts delegates trend perception to sonification                                                                | CONFIRMED (feature-overview quote)                                                                                                              |
| Okabe-Ito / Tol / ColorBrewer hex values + provenance caveats                                                        | CONFIRMED (multiple authoritative mirrors; original jfly page publishes swatch not hex — caveat documented)                                     |
| WCAG 1.4.11 thin-stroke anti-aliasing guidance; 3px "thick" threshold is consultancy interpretation not normative    | CONFIRMED (Understanding doc quoted; threshold correctly attributed)                                                                            |
| forced-colors: spec forces SVG fill/stroke (MDN) but engines historically diverged → explicit re-declaration pattern | CONFIRMED (MDN + css-color-adjust-1 + conflicting secondary resolved and documented)                                                            |
| ⚠ role="img" child pruning                                                                                           | CORRECTED → SHOULD-level UA guidance, not hard guarantee (ARIA 1.2 quoted). Patched.                                                            |
| ⚠ "redundant with text = decorative" per W3C decision tree                                                           | CORRECTED → tree splits this across Decorative and Functional branches; same empty-alt implementation. Patched.                                 |
| ⚠ bare aria-label reliability                                                                                        | CORRECTED → `<title>`+`aria-labelledby` is the more robust pattern; adopted. Patched.                                                           |
| ⚠ 2.3.3 covers data-update animation                                                                                 | CORRECTED → 2.3.3 (AAA) = interaction-triggered only; auto-update motion falls under 2.2.2 (A), exempt below 5 s. Matrix rewritten. Patched.    |
| ⚠ aria-live polite = "the" pattern for live charts                                                                   | CORRECTED → no APG chart pattern exists; MDN warns against per-update announcements; throttled/off design aligned and documented. Patched.      |
| Graphics-ARIA roles: uneven AT support                                                                               | CORROBORATED (spec's own fallback-role recommendation is the evidence; no current a11ysupport.io matrix exists)                                 |
| Apple Audio Graphs details                                                                                           | FLAGGED (inspiration only; no plan claims depend on it)                                                                                         |
| SAS Graphics Accelerator / ChartML history                                                                           | CONFIRMED for product facts; ChartML spec document itself unlocatable (noted)                                                                   |

## Architecture & performance (03, 07)

| Claim                                                                          | Status                                                                                                                                                                   |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| SVG cost ∝ node count; canvas cost ∝ pixel area; micro scale favors SVG        | CORROBORATED (multiple sources incl. ECharts handbook, jointjs, svggenie) + real-world thresholds CONFIRMED (reactable #17, Felt, Glide, AG Grid, Lighthouse 1,500-node) |
| No public "N tiny charts" benchmark exists                                     | CONFIRMED-BY-ABSENCE (searched; we build it — plan item)                                                                                                                 |
| No RSC-native chart library exists                                             | CORROBORATED (Tremor 'use client' throughout, Nivo hydrates; LogRocket/PkgPulse 2026 surveys) — strong but not exhaustive; validated again during Phase 2 bench work     |
| CSS `d: path()` has no Safari support (2026)                                   | CONFIRMED (MDN + caniuse)                                                                                                                                                |
| WASM not justified at micro N (boundary-call costs)                            | CONFIRMED (Mozilla Hacks, v8.dev) + 2026 consensus CORROBORATED                                                                                                          |
| viewBox/non-scaling-stroke responsive technique                                | CONFIRMED (MDN, caniuse 96%, Rich Harris precedent)                                                                                                                      |
| Container queries ~92% support; no chart lib uses them                         | CONFIRMED (caniuse) / CONFIRMED-BY-ABSENCE                                                                                                                               |
| Per-SVG-node memory bytes; typed-array crossover N; SMIL 2026 status           | FLAGGED (agent self-flagged; no plan decision depends on exact values)                                                                                                   |
| React: shared ResizeObserver > per-instance; useSyncExternalStore SSR snapshot | CORROBORATED (WICG guidance, react.dev)                                                                                                                                  |
| ⚠ React Compiler compile-and-ship for libraries                                | CONFIRMED (react.dev quoted) — but runtime package = direct dependency → **conflicts with zero-dep; compiler dropped from v1.** Patched.                                 |

## Design language (05, 06)

| Claim                                                                           | Status                                                                                                                                                                                   |
| ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tufte positions/quotes (pie/gauge rejection, sparkline anatomy, banking to 45°) | CORROBORATED (edwardtufte.com notebooks + established secondary; book-page-level cites are from research summaries, spot-check against print before publishing the philosophy docs page) |
| Bullet graph spec (Few)                                                         | CONFIRMED (perceptualedge spec PDF)                                                                                                                                                      |
| Vercel/Linear/Stripe token-level aesthetic observations                         | CORROBORATED (design-token analysis sites; inherently interpretive)                                                                                                                      |
| Tabular-nums as table-stakes                                                    | CORROBORATED (multiple 2025–26 sources)                                                                                                                                                  |
| shadcn CSS-var theming mechanics; Tremor Tailwind coupling                      | CONFIRMED (official docs)                                                                                                                                                                |
| ⚠ "Gallery-first landing pages" hypothesis                                      | CORRECTED → checked uPlot/ECharts/Plot/Tremor: all are hero + demo, gallery one click away. Roadmap patched.                                                                             |

## Tooling & OSS ops (09, 10, 11)

| Claim                                                                                                                | Status                                                                                                  |
| -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| tsdown v0.22.3 active; tsup maintenance-only since Nov 2025 (same maintainer); directive-preservation history        | CONFIRMED (registry timestamps via curl, GitHub API, commit logs). Smoke test added to plan.            |
| size-limit v12.1.0 active; ⚠ its popular GitHub Action stale since 2024                                              | CONFIRMED / CORRECTED → custom CI step. Patched.                                                        |
| fast-check v4.8.0 + @fast-check/vitest (peer vitest ^4.1)                                                            | CONFIRMED (registry)                                                                                    |
| Vitest 4.1.9 stable, browser mode stable, v5 in beta; RTL 16.3.2 React-19 peers                                      | CONFIRMED (registry timestamps)                                                                         |
| Peer range idiom `^18 \|\| ^19`                                                                                      | CONFIRMED (registry metadata of tanstack/radix/cmdk/vaul latest versions, staleness of each noted)      |
| Changesets dominance; npm trusted publishing GA + auto-provenance + May-2026 config change; npm v12 script disabling | CONFIRMED (registry, GitHub changelogs, npm docs)                                                       |
| Shai-Hulud attack timeline                                                                                           | CORROBORATED (Unit42, Microsoft, Elastic, OpenAI posts)                                                 |
| Lost Pixel dead (Figma, 2026-04-22); Chromatic/Argos/Percy/Vizzly pricing                                            | CONFIRMED (live fetches incl. archived repo banner)                                                     |
| SVG snapshot flakiness causes + Docker/tolerance/attribute-assertion mitigations                                     | CONFIRMED (Playwright/Chromium issues, vendor docs; 2018-era sources flagged as durable-canonical)      |
| MIT license norm (13 peer libs individually verified); Covenant 3.0 + CC BY-SA 4.0; Renovate-for-monorepo            | CONFIRMED (raw LICENSE fetches, canonical repo files, registry data)                                    |
| Starlight v0.41 active; Ladle v5 active; Storybook = v10 (not 9); ⚠ Sandpack stale 15 months + Astro conflict        | CONFIRMED / CORRECTED → Sandpack dropped. **SUPERSEDED 2026-07-06** — see toolchain-recheck rows below. |
| Peer libs' docs are all bespoke Next.js (8 sites fingerprinted)                                                      | CONFIRMED — original Starlight-on-merits justification now reversed (see recheck below).                |

### Toolchain recheck — 2026-07-06 (live registry, session-driven)

| Claim                                                                                                                                   | Status                                                                                                                                                                                                                                                                                                                                                                                                                               |
| --------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ⚠ Ladle 5.1.1 last published **2025-11-04** (8mo, sleepy — slow cadence, 253k dl/wk)                                                    | CONFIRMED (registry) → **Ladle dropped**; local workshop = **Storybook 10** (10.4.6, daily releases, 17M dl/wk, Vite builder). Rationale: a11y addon → axe DoD, theme/viewport toggles → light/dark × 5-preset matrix, Chromatic/Argos native. Dev-dep only — zero-dep guarantee untouched. Patched (03/09/10/11 + CLAUDE.md/README).                                                                                                |
| Fumadocs (fumadocs-ui 16.10.7, **2026-06-29**, weekly releases, 779k dl/wk) vs Starlight (0.41.3, 2026-07-03, active)                   | CONFIRMED (registry) → **docs switched Starlight → Fumadocs.** Reason: React/Next-native = live-prop chart demos are first-class React with no Astro-island bridge (the friction behind Sandpack's fragility), most-modern default theme matches brand bar. Trade-off logged: more docs-site JS, but docs JS ≠ library bundle → size/zero-dep gates untouched. Shiki now inherited via `fumadocs-core` (no standalone pin). Patched. |
| jsdom has no SVG layout — `getBBox`/`getScreenCTM`/`getComputedTextLength` return 0                                                     | CONFIRMED (durable-canonical: jsdom non-support of layout) → **added second Vitest project: `@vitest/browser` 4.1.10 (Playwright provider) + `vitest-browser-react` 2.2.0** for interactive/real-SVG entries; node/jsdom retained for core math + static attribute assertions. Reuses existing Playwright. Patched (09/10 + CLAUDE.md/README).                                                                                       |
| knip 6.24.0 (2026-07-02, active) as unused-dep/export/file gate                                                                         | CONFIRMED (registry) → **added as CI gate #10** to keep zero-dep + tiny public surface honest. Patched (09/10 + CLAUDE.md/README).                                                                                                                                                                                                                                                                                                   |
| oxfmt still 0.x (0.57.0) — pre-1.0 formatter                                                                                            | CONFIRMED (registry) → **kept as-is** (bleeding-edge accepted, prettier fallback stands). No change.                                                                                                                                                                                                                                                                                                                                 |
| tsgo `@typescript/native-preview` still **7.0.0-dev nightly** (not stable)                                                              | CONFIRMED (registry) → plan's "watch, adopt at stable" unchanged — hold.                                                                                                                                                                                                                                                                                                                                                             |
| SVG text width is **unmeasurable at static render time** (`getComputedTextLength`/`getBBox` = 0 in jsdom, no layout engine server-side) | CONFIRMED (durable-canonical) → drove **decision doc 18**: static path labels by `text-anchor` + tabular-nums + `ch` gutters (digit-count width known from formatter, no DOM); measured layout is client-entry-only. Engineering decision, not external claim.                                                                                                                                                                       |
| CSS delivery for per-subpath + tree-shakeable lib                                                                                       | Engineering decision → **doc 19**: one layered `styles.css`, imported once, not per-chart-split; budget split (JS gzip per subpath vs one shared CSS artifact vs library budget). No external claim; recorded for traceability.                                                                                                                                                                                                      |
| Show HN mechanics, llms.txt adoption %, crawler-ignore data, X engagement decline                                                       | CORROBORATED (multiple sources; llms.txt = cheap differentiator, not growth bet — plan already frames it so)                                                                                                                                                                                                                                                                                                                         |
| `microcharts` npm availability                                                                                                          | CONFIRMED (registry 404, 2026-07-06) — register immediately                                                                                                                                                                                                                                                                                                                                                                          |

## Universal-rendering & AI-native additions (docs 13/14, verified 2026-07-06)

| Claim                                                                             | Status                                                              |
| --------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| resvg-js stale (latest 2.6.2, 2024-03-26) → rejected per maintained-only rule     | CONFIRMED (registry)                                                |
| sharp active (0.35.3, 2026-07-01) → server PNG recipe pick                        | CONFIRMED (registry)                                                |
| opentype.js revived (2.0.0, 2026-05-06) → optional outline package viable         | CONFIRMED (registry)                                                |
| satori active (0.26.0, 2026-03-20) but unnecessary (we emit SVG natively)         | CONFIRMED (registry)                                                |
| streamdown active (2.5.0, 2026-03-17) → streaming-markdown integration target     | CONFIRMED (registry)                                                |
| Browser-native export chain (XMLSerializer → Image → canvas → toBlob) is zero-dep | Platform-API fact; verified empirically in Phase 5b.1 tests         |
| Mermaid-fenced-block and Vega-Lite-JSON precedents for LLM-renderable formats     | FLAGGED (common knowledge, uncontroversial, non-load-bearing)       |
| SVG `@font-face` data-URI honored by browsers/tools — fidelity varies by consumer | FLAGGED → documented as tiered guarantee, tested per target in 5b.6 |

## Decision micrographs research (doc 16, verified 2026-07-06)

| Claim                                                                                             | Status                                         |
| ------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| Quantile dotplots: 97%-of-optimal decisions, CHI 2016/2018 (Kay, Fernandes et al.)                | CONFIRMED (papers located, idl.uw.edu)         |
| BoE fan chart conventions (band steps, two-piece normal, cone-widening-as-message)                | CONFIRMED (BIS paper + fanplot docs)           |
| Within-the-bar bias; graded bands calibrate better (Correll & Gleicher TVCG 2014; VSUPs CHI 2018) | CONFIRMED                                      |
| HOPs +35–41 pts accuracy; static HOP is invalid — quantile dotplot is the static analog           | CONFIRMED (design honored in EnsembleGhosts)   |
| SRE burn-rate visual conventions + 1×/6×/14.4× thresholds                                         | CONFIRMED (Google SRE Workbook, Datadog)       |
| Glanceability: bars <300 ms vs radial ≤1,780 ms at watch scale (Blascheck et al.)                 | CONFIRMED — quantifies our gauge rejection     |
| Multiscale degradation order (arXiv 2404.01485)                                                   | CONFIRMED — adopted as system rule             |
| Horizon chart 2–3 band cap (Heer et al. lineage)                                                  | CORROBORATED via xenographics/Heer references  |
| Retention plateau conventions, Shewhart ±3σ, Cleveland diff patterns                              | CONFIRMED (practitioner + classic sources)     |
| "Percentile pizza" as a named form                                                                | NOT FOUND — colloquial only; not cited in docs |

## Frontier research cycle (doc 17, verified 2026-07-06)

| Claim                                                                                                      | Status                                                                                            |
| ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| WMO station model slot grammar; wind barb quantization                                                     | CONFIRMED (Wikipedia/WMO refs + MDPI implementation paper)                                        |
| PFD tape displays incl. NASA study of moving-tape formats                                                  | CONFIRMED (NASA NTRS 19870010832)                                                                 |
| AGP/TIR international consensus (Johnson et al. 2019) — committee-ratified microchart                      | CONFIRMED (Diabetes Care/DTT)                                                                     |
| Hypnogram no-smoothing rule + CHI 2022 wearable sleep-vis evaluation                                       | CONFIRMED                                                                                         |
| SoundCloud max-per-bucket waveform rule + peak-normalize pitfall                                           | CONFIRMED (practitioner docs)                                                                     |
| LUFS dual-window + target metering (ITU-R BS.1770/EBU R128)                                                | CONFIRMED                                                                                         |
| Word-scale visualization lineage (Goffin 2014 → GistVis 2025); 80%-icons in-the-wild finding (CHI EA 2026) | CONFIRMED                                                                                         |
| Pattern-as-variable + B/W textures evaluated (He et al. TVCG 2024/2026)                                    | CONFIRMED                                                                                         |
| Fading-edge uncertainty band taxonomy (arXiv 2508.00937)                                                   | CONFIRMED                                                                                         |
| Star glyphs validated / Chernoff faces dead                                                                | CONFIRMED (2022 J.Vis param study + 2021 CHI workshop)                                            |
| Token-logprob discrete-tier rule                                                                           | CORROBORATED — LLM-FACETS preprint is low-authority; cited cautiously, rule adopted on its merits |
| "Uncertainty urchins", "gestalt lines"                                                                     | NOT FOUND — flagged non-existent, not implemented                                                 |
| EV range-confidence cones                                                                                  | REJECTED for now — patent-stage, not practice                                                     |
| FUI/readiness-ring/EV-particle forms                                                                       | REJECTED — decoration masquerading as encoding (documented)                                       |

## Codex additions cycle (2026-07-06, completed by Claude after Codex rate-limit cutoff)

| Claim                                                                                      | Status                                                                               |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| CyclePlot / seasonal-subseries plot (Cleveland 1993 lineage, NIST/SEMATECH guidance)       | CORROBORATED (Codex web pass; matches our own doc-16 deferred Q19 candidate)         |
| ParetoStrip conventions (ASQ procedure; 80% as reference not law)                          | CORROBORATED                                                                         |
| PhaseTrace (dynamical-systems phase portraits)                                             | CORROBORATED — precision caveat documented (medium; axes must be named)              |
| TraceFold (OpenTelemetry span trees / flame charts, critical path)                         | CORROBORATED (ubiquitous practitioner convention)                                    |
| EventRaster (neuroscience spike rasters)                                                   | CORROBORATED                                                                         |
| CalibrationStrip (reliability diagrams — DeGroot/Fienberg; Guo et al. 2017)                | CORROBORATED                                                                         |
| PartitionStrip (icicle plots — Kruskal & Landwehr 1983)                                    | CORROBORATED                                                                         |
| Gallery UTF-8 charset missing; stale expressive E-numbering; README compiler contradiction | CONFIRMED defects (Codex found; README fixed by Codex, gallery fixes completed here) |

Note: Codex's citations were spot-checked for plausibility but not independently re-fetched — classified CORROBORATED, not CONFIRMED. All seven forms are standard named techniques with decades of practice; risk is low.

## Net result of verification round

- 8 corrections found and patched (5 a11y, React Compiler/zero-dep conflict, size-limit action, Sandpack, gallery-first).
- **Toolchain recheck 2026-07-06 (see rows above):** 4 tooling shifts — Ladle→Storybook 10 (Ladle went sleepy), Starlight→Fumadocs (React-native docs), +@vitest/browser project (jsdom has no SVG layout), +knip gate. oxfmt (0.x) and tsgo (dev) held unchanged. No thesis/catalog/budget impact — all dev-tooling; zero-dep + size gates untouched.
- 0 plan-structural changes required — the thesis, whitespace, catalog, architecture, and budgets all survived on CONFIRMED evidence.
- Remaining FLAGGED items are explicitly non-load-bearing (inspiration/context only) or scheduled for empirical validation in Phase 2 (bench work re-validates the RSC-gap and perf claims against live competitors).
- Standing rule going forward: any new factual claim entering these docs gets a provenance class in this file.
