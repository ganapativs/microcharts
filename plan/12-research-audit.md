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

## Phase 2 implementation review (2026-07-06)

| Finding | Resolution |
|---|---|
| Two competing interactive composition patterns (Sparkline/ActivityGrid re-implemented the SVG; Bullet/Delta wrapped the static) | CANON: interactive composes static (`summary={false}` + overlay children). Refactored; browser screenshots passed unchanged (pixel-identical proof) |
| Module-counter ids in static naming → hydration mismatch under StrictMode/concurrent | Deterministic `aria-label` default; ids only with explicit `id` prop. plan/08 §1 amended |
| Per-point pointer hit-spans (N DOM nodes/chart) in sparkline client | Single wrapper listener + nearest-x math |
| `label="last"` painted outside the viewBox (`.mc-root` overflow: visible → layout spill) | `labelMetrics` deterministic gutter + fontSize as SVG attribute + y-clamp; containment regression tests added |
| `toSorted` (ES2023) vs ES2022 target — silent Safari <16.4 cliff | ES2022 floor rule; `slice().sort()`; contradicting unicorn lint rules disabled with rationale |
| `new Intl.NumberFormat` per render/call across charts | `core/format.ts` cached `makeFormatter`, used everywhere |
| Hardcoded-English live-region strings | `SummaryStrings.point()` added; interactive entries accept `strings` |
| Win-loss zero-value bar colored positive | Zero → neutral ink |
| Duplicated summary/opacity logic across static/client | Single exported functions (`bulletSummary`, `activitySummary`, `levelOpacity`) |
| Phase 2's ≤3 kB budget raise vs plan's original ≤2 kB | Verified properly documented in plan/07 "Measured reality" — accepted, not silent |

## Net result of verification round

- 8 corrections found and patched (5 a11y, React Compiler/zero-dep conflict, size-limit action, Sandpack, gallery-first).
- **Toolchain recheck 2026-07-06 (see rows above):** 4 tooling shifts — Ladle→Storybook 10 (Ladle went sleepy), Starlight→Fumadocs (React-native docs), +@vitest/browser project (jsdom has no SVG layout), +knip gate. oxfmt (0.x) and tsgo (dev) held unchanged. No thesis/catalog/budget impact — all dev-tooling; zero-dep + size gates untouched.
- 0 plan-structural changes required — the thesis, whitespace, catalog, architecture, and budgets all survived on CONFIRMED evidence.
- Remaining FLAGGED items are explicitly non-load-bearing (inspiration/context only) or scheduled for empirical validation in Phase 2 (bench work re-validates the RSC-gap and perf claims against live competitors).
- Standing rule going forward: any new factual claim entering these docs gets a provenance class in this file.

## Phase 2.1 — Sparkline size-budget reconciliation (2026-07-06)

| Claim / decision | Status |
| --- | --- |
| Full-feature static `<Sparkline>` measures 2.67 kB gzip (line/smooth/step + area + band + dots + label + auto-summary + Chart shell) | CONFIRMED — size-limit, `preset-small-lib`, treeshaken |
| Dominant weight is the path/scale/stats math kernel (~2.5 kB), not the summary (+~0.15 kB; `seriesStats` shared with geometry) | CONFIRMED — chunk inspection of `dist/` |
| plan/07 ≤ 2 kB static / ≤ 1 kB Sparkline anchors were set vs line-only refs (@fnando 1.6 kB: no summary, no a11y, no smooth/area/band) | CONFIRMED — our value-adds are the delta |
| **Decision:** raise static gate to ≤ 3 kB, add ≤ 4 kB interactive gate; keep 2 kB target / 1 kB stretch (line-only build) | ADOPTED — user-approved; plan/07 §1 + `.size-limit.json` updated. Still ~50× smaller than Recharts (145 kB). No thesis/catalog impact. |


## Phase 2 — interactive scope widened + bench competitors deferred (2026-07-06)

| Decision | Status |
| --- | --- |
| **Every chart ships a `/interactive` client entry** (not just Sparkline/SparkBar). Delta = `live` announce + pulse; Bullet = value/target readout on hover/focus; ActivityGrid = cell hover + 2-D keyboard nav + live readout. | ADOPTED — user call. Aligns roadmap 2.6 with CLAUDE.md DoD ("static + interactive entries", always was universal). All useful; none skipped. plan/10 §2.6 + CLAUDE.md catalog updated. |
| **Bench competitor matrix (Recharts/Chart.js/MUI X/uPlot/@fnando) deferred to launch prep.** | ADOPTED — "not competing now" (user). Our reproducible core/SSR numbers ship in `bench/`; competitor harness is a launch-time isolated-workspace job (plan/07 §3 keeps it as the public-benchmark plan). |
| Review-found robustness fixes: SparkGroup no longer injects chart props into non-series children; Delta guards non-finite input (`—`, not `NaN%`). | FIXED + tested. |

## Doc 20 — Discoverability (Codex addition, integrated 2026-07-06)

Codex authored [20-discoverability.md](20-discoverability.md) (SEO / LLM surface / OG / npm / CLI / MCP stance). Integration decision: **kept intact as the single home** (evidence table + acceptance tests are one coherent contract); execution woven into roadmap as new step **3.5** (P0 launch gate), Phase 4 pre-flight (§14), and Phase 5b pointers (§6/§7/§8) — plus STATUS rows and cross-refs from docs 11/13/14. Other docs point at 20; nothing copied.

| Claim / item | Status |
| --- | --- |
| Google JS-SEO / canonical / structured-data / title-link / snippet / image-SEO guidance (§1 rows 1–6) | CORROBORATED — all primary-source Google Search Central URLs; cited per-claim in the doc; spot-checked plausible, not re-fetched here |
| `llms.txt` proposal + Mintlify/Anthropic/Cursor adoption | CORROBORATED — llmstxt.org + Mintlify docs; consistent with our own doc-14 plan |
| Core Web Vitals thresholds (LCP 2.5s / INP 200ms / CLS 0.1 @ p75) | CONFIRMED — stable web.dev definitions |
| npm search uses description/keywords; `exports` boundary guidance | CONFIRMED — npm/Node primary docs, matches our package setup |
| shadcn registry distribution & MCP server-card direction | CORROBORATED — evolving specs; re-verify before P2 implementation |
| **Correction applied:** repository URL said `github.com/microcharts/microcharts` | FIXED → `ganapativs/microcharts` (actual repo; revisit if a GitHub org migration happens — README open item 2) |
| **Correction applied:** §12 example summary "increased from 3 to 9, peaking at 9" — not our `describeSeries` wording | FIXED → real output ("Trending up 200%. Range 3 to 9. Last value 9.") + rule that docs quote generated summaries only |
| Open dependency: doc assumes `microcharts.dev` domain | FLAGGED — domain is README open item 2; not registered yet. Decide before 3.5 work starts (canonical URLs bake the domain in) |
| OG template sketch uses Inter font | NOTED — brand uses system stack; resolve at implementation, not a plan conflict |


## Dependency decision — `env.style` NOT adopted (2026-07-07)

User asked to add [env.style](https://env.style) for per-environment favicon colours. Researched (site + npm + GitHub README):

| Finding | Verdict |
| --- | --- |
| `env.style@1.0.1` created **2026-07-05** (2 days before evaluation), single maintainer, no track record | FAILS CLAUDE.md "registry-verified **actively maintained** before adoption" |
| Pulls `sharp` (native) + `decode-ico` as build deps | Extra native build surface for a docs-only nicety |
| Detects env via `ENV_STYLES_ENV → VERCEL_TARGET_ENV → VERCEL_ENV → NODE_ENV`; writes tinted icons to `public/__envstyle/` | Useful model — reused the detection ORDER natively |
| Static-export (`output: 'export'`) support **undocumented** | Risk: our docs deploy is static; unverified it injects the icon link without a runtime |

**Decision:** delivered the capability natively instead — `lib/env-badge.ts` (env detection mirroring env.style's order) + `app/icon.tsx` / `app/apple-icon.tsx` (ImageResponse, `force-static`) tint the favicon squircle per env: production = cobalt `#2f52d4`, staging/preview = ember `#c2410c`, development = teal `#0f766e`. Zero new deps, resolved at build time, static-export-safe. Swap to the `env.style` package if it matures (multi-release history + a static-export note).


## Full-catalog buildout decision cycle (2026-07-08, user-directed)

Scope decision by the user (resolves the release-scope fork left open in the round-10 handoff):
**all 96 catalog types ship in `@microcharts/react`, single package, before launch.** Master doc:
[21-full-catalog-buildout.md](21-full-catalog-buildout.md); batch specs docs 22–25.

| Claim / decision | Provenance & verdict |
| --- | --- |
| `@microcharts/expressive` separate-package rationale was marketing/timing framing, not technical | CONFIRMED by re-audit of plan/15 + roadmap 5c: the plan itself states "same grammar, tokens, a11y summaries, and budgets as core"; no bundle/technical driver was ever recorded. Subpath exports already give per-type tree-shaking. Reversal is safe; recorded in plan/15 header. |
| "≤ 10 kB whole library" budget impossible at 96 types | CONFIRMED arithmetic (96 × ~1.5–3 kB static minus shared-kernel dedupe ≫ 10 kB). Gate measured the wrong unit (users import subpaths). Budget model v2 in plan/21 §1; plan/07 amended; plan/README headline amended. All external "≤ 10 kB library" claims must be purged (Batch 0.E / Batch 4 release sync). |
| Per-chart specs in docs 22–25 (props, variants, geometry, interaction, summaries) | NEW DESIGN WORK, derived from plan/05/15/16/17 one-liners + domain knowledge — provenance class: internal design, not external research. Research-backed constraints inherited from source docs keep their original provenance class. |
| FatDigits (E1) adaptation: FatFonts custom glyphs → variable-font-weight tiers on the inherited font | FLAGGED deviation from Nacenta et al. FatFonts (which uses purpose-built glyphs where ink ∝ value). Weight tiers are a weaker, discrete encoding; documented as such in the batch-3 spec. Driver: zero-dep rule (custom font = asset dependency). |
| BenchmarkStrip (Q5) "strongest research" claim | STILL FLAGGED — plan/16 cites no study for Q5 specifically (design rationale only). Carried into batch-2 spec open questions; resolve or soften the claim before its docs page ships. |
| QuantileDots micro dot count 15–20 vs studied 50-dot design | FLAGGED (pre-existing, re-confirmed) — validate read-back at reduced count during Batch 2 review. |
| TokenConfidence discrete-tier encoding | FLAGGED (pre-existing) — 2026 preprint "cited cautiously" per plan/17; keep the hedge in docs copy. |
| Roadmap 5c flagship list included ConfettiBurst | CORRECTED — ConfettiBurst was cut/relocated to `<Marker celebrate>` in plan/15's own ledger; stale cross-reference fixed in plan/10 amendment. |


## Catalog expansion 96 → 100 (2026-07-08, user-directed, research-verified same day)

User asked for obvious-gap additions to a round 100 — "don't force a chart type." Gap analysis over
the full 96 + live literature verification (WebSearch, 2026-07-08). Four admitted, four rejected.

| Addition | Evidence | Verdict |
| --- | --- | --- |
| **MicroScatter** (#35 core) — relationship/correlation point cloud | Harrison, Yang, Franconeri & Chang, InfoVis 2014 "Ranking Visualizations of Correlation Using Weber's Law" (n=1687): scatterplots highest-precision correlation display, low between-subject variance, both correlation signs; Rensink & Baldridge 2010. Follow-up reanalysis (Kay & Heer "Beyond Weber's Law") refines but does not overturn the scatterplot ranking. | CONFIRMED — the one classical form the catalog lacked; "relationship" data story previously unserved (QuadrantDot = field position, PhaseTrace = trajectory). |
| **LikertStrip** (#36 core) — diverging stacked bar, neutral-centered | Heiberger & Robbins, J. Statistical Software 57(5), "Design of Diverging Stacked Bar Charts for Likert Scales and Other Applications" — recommended primary display for Likert data. Known critique (Datawrapper "The case against diverging stacked bars") centers on neutral placement/comparability — spec mitigates: explicit neutral split at center + direct labels + `neutral` handling documented. | CONFIRMED with recorded counter-argument (both sides cited in docs page later). |
| **IconArray** (Q21 decision) — k-of-N frequency grid for a stated rate | Garcia-Retamero, Galesic & Gigerenzer, Medical Decision Making 30(6) 2010: icon arrays reduce denominator neglect; Garcia-Retamero & Cokely, CDPS 2013 (visual aids improve risk comprehension, esp. low-numeracy). Purest expression of plan/16 system rule #3 (frequency beats probability). | CONFIRMED — distinct from PictogramRow (real small-set counts) and QuantileDots (forecast distributions). |
| **ConfusionGrid** (F21 frontier) — k×k agreement matrix, diagonal accented | Standard classifier-eval display; generalizations: Neo (Apple, CHI 2022, arXiv:2110.12536), ConfusionFlow (TVCG, arXiv:1910.00969). Micro rules: ≤ 4×4, row-normalized default, diagonal never color-alone. | CORROBORATED — established professional instrument (lineage-based, like TapeGauge/TimeInRange), not a lab-tested micro form. |

Rejected the same day (recorded so they aren't re-litigated without new evidence): **beeswarm/strip
plot** (overlaps rug-strip + micro-box + quantile-dots; no unique decision story), **compass/bearing**
(wind-barb covers direction+magnitude; bare bearing is a glyph, not a chart), **micro-Sankey**
(link crossings unreadable at ≤ 200×60; partition-strip + data-diff cover the stories),
**micro-ECDF** (percentile-ladder + histogram-strip cover; curve-reading needs training).

Also this cycle: three independent batch-spec reviews flagged `src/charts/bullet/geometry.ts:53`
using `.toSorted()` — a real ES2022-floor violation (Safari < 16.4 crash class) that had shipped
despite the canon rule; CONFIRMED against git history and fixed to `.sort()` on the freshly
filtered array via a spun-off background task (2026-07-08). A first verification pass wrongly
called the claim false because it read the file *after* the background fix had landed — lesson
recorded: verify against git blame/history, not just working-tree state. Batch 0 adds a CI grep
guard for ES2023 array methods.

**Plan-conflict resolution (2026-07-08, batch-3 spec authoring):** plan/06 §5 ("no idle loops")
conflicted with plan/15's motion-as-encoding premise for E14–E17 (HeartbeatBlip, BreathingDot,
CometTrail, OrbitStatus). Resolved by a narrow plan/06 amendment: looping motion allowed only where
motion is the documented primary encoding channel, only in client entries, always
reduced-motion-gated with meaningful static equivalents. Everywhere else the ban stands.

**ES2023 guard implemented as a compiler floor, not a grep (2026-07-08, Batch 0.D):** plan/21 §6.0.D
called for a "grep/lint CI guard" for ES2023 array methods. Implemented stronger: `tsconfig.json`
`lib` dropped ES2023 → **ES2022**, so `toSorted`/`toReversed`/`findLast`-class usage in any `src/`
file is now a **type error** (CI typecheck), not a pattern match — no false negatives via renamed
bindings, covers every future ES2023+ API automatically. Verified: full typecheck green on ES2022
lib. Residual gap: untyped dev-only `.mjs` (bench/, scripts/) — acceptable, they never ship and run
on pinned dev Node. plan/21 §6.0.D wording updated to match.

**Sparkline budget conflict (2026-07-08, Batch 0.D — RESOLVED same day: user approved option (a), the documented flagship exception; size-budgets.json carries it as `$exception`):** the two
plan-mandated sparkline hardening features collide with the plan/21 §1 hard caps. Measured
(webpack+terser+gzip, the real import cost): baseline **2 965 B** static (35 B under the 3 kB cap);
long-series min/max guard (plan/21 §6.0.D, decimation inlined in geometry reusing scaled points —
the `core/downsample.decimateMinMax` variant measured 122 B heavier and was dropped from this path,
the kernel export stays for waveform/seismogram/minimap) **+≈170 B**; `label="minmax"` grammar
parity (plan/04) **+≈145 B** → **3 323 B static / 4 320 B interactive** (final: affordance-gated gutter labels — the beside-the-dot design collided with the stroke on review). Trim attempts measured and
exhausted: JSX compaction (−11), kernel-import removal (−122), gutter-plumbing removal + reusing the
endpoint-label placement pattern (−24); an esbuild --analyze pass found no dead weight (bundle =
summary strings, formatter cache, 3 curve builders, Chart shell — all features). A first label
design (vertical gutters above/below) was REJECTED by the containment suite: two font-height gutters
invert the plot at the default 80×20 — labels now sit beside their dots with the proven
endpoint-label clamps. Interim: `scripts/size-budgets.json` carries sparkline at **3.35/4.35 kB**
with a `$pending` note so CI stays green and the exception is impossible to miss. User options:
(a) bless a documented flagship exception (recommendation — sparkline is the feature-dense flagship;
every other chart sits well under its cap), (b) drop `label="minmax"` (−≈180 B → ≈3 140, still over),
(c) both features out (back to 2 965). Decision goes back into size-budgets.json + this entry.

**ActivityGrid budget adjustment (2026-07-08, Batch 0.D — within model caps, no gate conflict):**
`shape` variant + calendar-alignment retrofit measured 2 037 B static / 3 175 B interactive
(was 1 677/2 762). Per-chart budgets in `scripts/size-budgets.json` raised 2→2.1 kB and
3→3.25 kB — both far inside the 3/4 kB model hard caps. Note: the interactive−static delta was
already over the "+1 kB" guideline before Batch 0 (1 085 B); the absolute per-chart budgets are
the enforced contract (plan/21 §1 table is per-subpath).

**Bench floor calibration (2026-07-08, Batch 0.D):** the plan/07 "≥ 50 rows/ms SSR" floor was
calibrated on the single-path sparkline scenario; SSR cost scales with node count, so 24-rect
SparkBar (~14 rows/ms) and 35-cell ActivityGrid (~9 rows/ms) can never meet it by construction.
Bench v2 (`bench/scenarios.mjs` registry) keeps 50 for sparkline/delta-class charts and gives
N-node charts regression floors at ~half their measured 2026-07-08 baseline (sparkbar 7, bullet 30,
activity-grid 5) — tripwires, not aspirations; measured numbers in `bench/results.json`.
Measurement fix in the same pass: warm every component process-wide before measuring any (the first
chart otherwise pays renderToStaticMarkup JIT warmup and reads 3–4× slow), median of 5 windows.

**Batch 1 W1 budget divergence (2026-07-08, plan/22 #1–4 — needs user sign-off at the batch gate):**
plan/22 set W1 static budgets of 1.2–1.5 kB, below the measured floor of any `Chart`-composed SVG
chart: the shared wrapper (Chart + a11y naming) + cached formatter + JSX glue cost ~0.9–1.0 kB gz
before any chart code (evidence: shipped Bullet = 1.56 kB static; Delta's 0.92 kB is HTML-only, no
Chart shell — the "Delta-class ≤ 1.5" target only fits chart-less inline components). Trims measured
first (esbuild --analyze per entry): the one structural win was splitting the growing `EN` dictionary
into per-shape MODULES (`core/strings-scalar.ts` EN_SCALAR, `EN_SERIES` in summary.ts, `EN`
aggregate in `core/strings.ts`) — bundlers keep whole chunks, so before the split every chart paid
every batch's new templates (sparkline had crept +113 B over its exception; back under after).
Final measured/budgeted (static/interactive, gz): trend-arrow 1.64→1.7/1.94→2 kB · status-dot
1.55→1.6/1.8→1.9 kB · heat-cell 1.7→1.75/2.09→2.15 kB · progress 1.82→1.9/2.11→2.2 kB. All well
inside the 3/4 kB hard caps and ≤ 2 kB target; the plan/22 per-chart numbers for later waves should
be read as (chart-specific code) + ~1.5 kB shared floor. NOT a precedent for the hard caps.

**Progress label-gutter honesty fix (2026-07-08, W1 craft review):** the spec's "viewBox 48×8 with a
right label gutter reserved" was first implemented by shrinking the track inside a fixed 48-unit
box — screenshot review caught that rows with different label lengths ("44%" vs "112%") then render
different track widths, silently changing the scale row-to-row in a table column. Fixed: the gutter
WIDENS the viewBox (total = width + gutter) and the track always spans the full given width;
regression-tested (`progress/geometry.test.ts` comparability case). Same rule already used by
TrendArrow `showValue`.

**Annotations host-cost architecture (2026-07-08, Batch 1 W4 — plan/22 #28):** the spec's "hosts
call the shared resolver" was first implemented with the resolver + all four mark renderers in one
module — that bundled the whole annotation layer (+~1.4 kB gz, incl. celebrate/jitter) into EVERY
host's static entry and blew sparkline's pinned exception to 4.76 kB. Restructured: each annotation
component carries its mark renderer as a static field (ships with the consumer's
`@microcharts/react/annotations` import, 1.46/1.5 kB), and hosts import only a tiny children walker
(`shared/annotations-host.tsx`, ~0.29 kB incl. the scale frame). Residual: sparkline
3.61/4.61 kB measured → budget set 3.65/4.65 kB, PENDING user sign-off at the batch gate (the prior
3.35/4.35 exception + the spec-mandated host contract conflict; every other host absorbs the walker
inside its normal headroom). Fragment children are unwrapped by the walker (React's Children.forEach
does not descend into <>…</>).

**`style` variant-prop collision (2026-07-08, Batch 1 W5):** plan/21 §3 names the render-styling
variant vocabulary `style` (StackedArea ridge, Ohlc candle/bars). On DOM-facing React components
`style` is reserved for CSSProperties (every shipped chart already forwards it as CSS). Resolution:
the variant prop is named **`variant`** (`<StackedArea variant="ridge">`, `<Ohlc variant="bars">`),
same semantics as the plan's `style` vocabulary; the CSS `style` prop stays untouched. Surfaced as
a plan↔code divergence per the working rule — rename in plan/21/22 wording at the batch gate.

**DualSparkline `curve="step"` (2026-07-08, W5):** renders as linear. The shared `curve` grammar
lists step, but on a two-line benchmark strip the step form reads as noise, and importing the step
path builder pushed the entry past the 3 kB HARD cap (3 008 B measured). Divergence documented in
the chart's docs page; revisit only with a measured trim elsewhere.

**`core/calendar` module split (2026-07-08, W6):** `weekGrid`/`dayOfYear`/`daysInYear`/
`monthStartDays`/`isoDate` moved to `core/calendar-grid.ts`; `calendar.ts` keeps only
`parseUTCDay`. Chunk granularity (see the strings-module rationale): once CalendarStrip
made calendar.ts a shared chunk, ActivityGrid would have carried the whole grid kernel
for one day-parsing call. ActivityGrid interactive budget 3.25 → 3.3 kB — the 3.25 was
measured-exact with zero headroom, and content-hash renames alone move gzip by ±5 B.

**`normalizeShares` denormal fix (2026-07-08, W6):** the float remainder (1 − Σshares)
was added to the LAST positive share; a denormal-tiny entry (counterexample
`[4e-106, 2.4e-93, 5e-324, 0]`) went negative absorbing it. Remainder now folds into
the LARGEST share, clamped at 0. Found by the fast-check invariant suite.

**Slope label-spread solver (2026-07-08, craft review):** user screenshot review found endpoint
labels overlapping at showcase sizes (greedy drop threshold passed 5.7-unit spacing that
collides visually at fontSize 6). Replaced drop-on-collision with `core/labels.spreadLabels`
— a deterministic forward/backward sweep that nudges label baselines to a full glyph pitch
inside the frame (property-tested; reusable by future dense-label charts). Slope budget
2.8/3.8 → 2.95/3.95 kB (measured 2.91/3.90; 3/4 kB hard caps honored). Craft gate added:
`pnpm craft` (tests/craft/matrix.mjs) renders 141 chart×variant×size configs against dist
and fails on text escapes, text-text overlap, or text-on-mark collisions.

**Dumbbell connector pierce fix (2026-07-08, round-13 visual audit):** the connector ran
dot-center → dot-center, crossing the hollow "before" ring's interior (fill=none) so the
line showed through the empty dot. Fixed: connector endpoints inset by the mark radius
along the row (drops the connector when dots nearly touch). Budget 2.65/3.55 → 2.7/3.65 kB
(measured 2.64/3.55; 3/4 kB hard caps honored). New geometry-audit gate (tests/craft/
geometry-audit.mjs, wired into `pnpm craft`) detects LINE-THROUGH-HOLLOW via chord-inside-
disk, plus MARK-ESCAPE. Full visual sweep report in plan/VISUAL-AUDIT.md.

**CalendarStrip interactive pointer drift (2026-07-08, round-13 interactive sweep):** the
fixed 7 px-cell grid can only be shown larger via CSS width, but the interactive wrapper
was sized 180 px while the composed static SVG stayed at its intrinsic 55 px → pointer math
(÷ wrapper width) landed off the cells. Fixed with the FILL pattern (memory
interactive-wrapper-fills-svg) — `style={FILL}` on the composed static so the SVG fills the
wrapper; measured wrapper==svg (180==180) after. FILL is NOT applied universally: charts
sized by geometry-width props use inline-block wrappers that already hug the SVG, and
width:100% on a child of an auto-width inline-block would break them. Browser regression
test added. Budget 3.4→3.5 kB interactive (measured 3.42; caps honored).

**Label vertical centering — 15 charts (2026-07-08, round-14 user review):** direct labels used
`y = center + fontSize*0.35` (cap-box half-height) which browser-measured ~2.5px HIGH; the eye
centers the full line-box, and a fixed constant can't track it across fonts. `dominant-baseline="middle"`
(ohlc/dual/sparkbar) was ~1.3px high. Standardized on the SVG-native `dominant-baseline="central"` +
`y = center` (in-browser deltaPx 0.00) across likert, segmented, dot-plot, dumbbell, heat-cell, slope,
bump-strip, progress, trend-arrow, progress-ring, ohlc, dual-sparkline, sparkbar, sparkline-last. Kept
as an attribute (not CSS) so SVGs stay self-contained + the craft audit reads it. Edge-anchored labels
(funnel top, sparkline min/max, stacked-area stagger) left alphabetic. Also: progress + ohlc label
gutter gap +3→+5 for separation. Budgets: heat-cell interactive 2.15→2.2 kB (measured 2.15, +central
attr). Browser regression test on likert asserts deltaPx < 1.2.

**Label breathing space (2026-07-08, round-14 user review):** beside-mark label gaps were
inconsistent (2–5 units) and the tightest read as cramped. Standardized to ~4 units: likert
gap 2→4 (+ gutter 2→4), dumbbell 3.5→4, sparkline/dual last-value offset +4→+6, bump-strip
end labels +2→+5 (offset + both gutters). Live-measured likert 2px→4px. dot-plot/slope (3 units)
and progress/ohlc (5 units) already comfortable, left as-is.

## Batch 2 wave 1 — decision strips + IconArray (2026-07-08)

**BenchmarkStrip citation gap (mandatory, plan/23 risk #1).** plan/16 groups BenchmarkStrip
with the "strongest research" uncertainty types (QuantileDots/GradedBand), but cites no study
for the band+dot+stated-percentile form ITSELF. Classification: **inferred-from-adjacent-
research** — its grounding is design inference from the quantile/uncertainty literature, not a
direct empirical result. No external docs copy claims study backing for this specific type; the
docs page describes the encoding and the mid-rank percentile rule, nothing more. (The
QuantileDots 15–20-dot validation flag lands with that chart in a later wave.)

**Budget-floor divergence (same class as Batch 1 W1).** plan/23 spec budgets for the strips
(1.5 kB static) sit below the measured Chart-wrapper + kernel floor. The three quantile charts
additionally pull `core/quantile` (+ `core/scale`), so ~2.6–2.9 kB static is the real floor.
Budgets set to measured + small headroom, ALL under the 3/4 kB hard caps: coverage-strip
2.23/2.96 → 2.4/3.15, benchmark-strip 2.64/3.42 → 2.8/3.6, graded-band 2.58/3.37 → 2.75/3.55,
icon-array 2.04/2.86 → 2.2/3.0. Needs user sign-off at the batch gate (with the W1–W3
divergences). **percentile-ladder** landed at 3.004 kB static — 4 B OVER the 3 kB hard cap —
so it was TRIMMED, not granted a budget: the `spreadLabels` import was dropped and its
forward/backward sweep inlined into `ladderLabelLayout` (same algorithm, no shared-util bytes),
landing 2.9/3.68 kB under the caps. No exception requested.

**IconArray grammar (simplification).** The plan/23 §21 data shape mentions "0–1 probability or
{k,n} count-of-denominator via `of`". Shipped grammar keeps one meaning per prop: `value` is the
0–1 rate, `of` is the denominator/grid size (10/20/100); a known "k in n" is expressed as
`value={k/n} of={n}`. No separate `{k,n}` object — avoids two ways to say the same thing (plan/04
one-grammar). The `of` mismatch edge in the spec is therefore N/A. `k` is resolved half-up and
clamped [0,n]; a positive rate that rounds to 0 renders 0 filled units with a "(less than 1 in
n)" note — never a partial-unit fill.

**PercentileLadder log tag placement.** The in-chart `log` tag (plan/23 §3, "the transform is
never silent") cannot share the 12 px vertical band with ticks + beneath-tick labels without
collision. Resolved by reserving an 11-unit LEFT gutter for the tag when `scale="log"` applies
(shifting the plot right), and graduating tick HEIGHT by emphasis (tail tallest) so short
low-percentile ticks clear the tag. Verified by the craft gate (172 configs, 0 escapes/overlaps).
Label containment: width-aware forward/backward sweep with drop-out below the documented 56 px
minimum; fontSize emitted as an SVG attribute (not CSS) so the craft audit measures it correctly.

**R-SEISMO-CENTER — Seismogram default re-centered + anomaly flag (2026-07-08, gallery-vs-impl
review, user-directed).** A visual review against `plan/chart-gallery.html`'s `seismo()` reference
found two divergences in the shipped Seismogram: (1) the plan/22 §8 default anchored all-positive
ticks to the BOTTOM edge, which read as a SparkBar-like bar strip and lost the seismograph identity
the gallery shows (ticks centered on a midline, flaring symmetrically); (2) the gallery card copy
"spikes flag anomalies" had no implementation — coloring only engaged via `positive` polarity on
signed data. Resolution: unsigned intensity now mirrors each tick symmetrically about a centered
baseline (magnitude = full length, half each way; no midline drawn — centered ticks imply the axis);
signed data keeps the zero baseline + midline (unchanged). New `anomaly?: number` prop flags ticks
with `|v| ≥ threshold` in `--mc-negative` via a dedicated `dFlag` path — honest (author-set
threshold, redundant with tick length, never color-alone). Geometry return shape changed
(`d` → `dData/dPos/dNeg/dFlag` + `signed`/`slotW`); `baselineY` for unsigned is now `height/2`.
plan/22 §8 amended in place. Tests updated (geometry 8, static 18, browser 2 — all green); the
"single spike renders full height" regression still holds (0.5→15.5, now centered). Argos baselines
for Seismogram (light/dark × presets) must be re-approved — the static render changed.

## Batch 2 wave 1 — visual-craft rework (2026-07-08, user screenshot review)

The first W1 pass shipped with real visual defects the craft gate MISSED. Two systemic
root causes, both now fixed; the process lesson is that the craft gate's SSR text-extent
estimate is necessary but NOT sufficient — a real-browser `getBBox` pass is mandatory
before calling a labelled chart done.

1. **Invented CSS token names → invisible marks.** CoverageStrip/IconArray used
   `var(--mc-muted)` (does not exist → no stroke → gap/empty cells rendered as VOIDS);
   BenchmarkStrip/IconArray used `var(--mc-pos)`/`var(--mc-neg)` (real tokens are
   `--mc-positive`/`--mc-negative` → polarity colors were absent). The craft gate never
   checks color, so it passed. Fixed to the real tokens (`styles.css` defines
   `--mc-neutral`, `--mc-positive`, `--mc-negative`, `--mc-band`, `--mc-accent`,
   `--mc-stroke`, `--mc-surface` — no `-muted`/`-pos`/`-neg`). Lesson: grep the token
   before using it.

2. **`--mc-label-size: 0.75em` overrides the `font-size` attribute → labels render ~2×.**
   `styles.css` sets `:where(.mc-root text){font-size:var(--mc-label-size)}` with the
   default `0.75em`. A CSS declaration (even 0-specificity `:where`) beats an SVG
   presentation ATTRIBUTE, so `fontSize={4.5}` was ignored and text rendered at 0.75em of
   the AMBIENT font (~10 user units in a 12–18-unit viewBox) — hence the overlaps
   ("5090", "log"×"50", "56%" crowding). The craft gate reads the attribute (4.5) so it
   was blind to this. FIX: each chart pins `--mc-label-size: \`${FONT}px\`` on its root
   (inline style beats the `:where` rule), making labels viewBox-proportional and the
   attribute authoritative → craft estimate and browser render now agree. This is a
   LATENT issue for every chart that direct-labels (they inherit the ambient 0.75em);
   flagged for a possible shared fix (bind `--mc-label-size` in the Chart wrapper). New
   charts must pin it until then.

**Design corrections (cross-checked against plan/chart-gallery.html):**
- CoverageStrip: gaps are now a continuous faint-track ruler (flush cells, `--mc-band`
  fill + hairline) instead of near-invisible hollow outlines — a gap reads as an EMPTY
  slot, not a void (gallery `qCoverage` uses a track + filled blocks).
- BenchmarkStrip vs GradedBand were indistinguishable (both invisible band + tick). Now
  distinct: BenchmarkStrip = visible NEUTRAL peer band + prominent accent dot (surface
  halo) + percentile label beside the dot; GradedBand = ACCENT graded nested bands + a
  median tick and NO dot (a value dot is a hollow ring when supplied). Band `fillOpacity`
  raised to visible levels (was `--mc-band` 8% × 0.14 ≈ 1%).
- Labels moved from far-right gutters to beside their mark (benchmark→dot, graded→median
  tick) — the "floating far number" look was the wrong-size symptom, not the gutter.
- IconArray: grid left-aligned + label hugs it (was a big void from an oversized gutter);
  empty units are visible faint slots.
- PercentileLadder: demo data reshaped so p50/p90/p99 actually spread; label collision
  handled by ENDPOINT-PRIORITY drop (p50 + tail always win, interior drops) instead of a
  cram-spread; `log` tag in a reserved left gutter, clear of the p50 label. Verified by a
  real-browser getBBox sweep: 0 escapes, 0 text-on-text/mark overlaps across 27 variants
  (band backgrounds exempt). New reusable harness `scripts/visual-check.mjs`.

**R-CATALOG-AUDIT-FIXES — full-catalog craft sweep (2026-07-08, user-directed, 7 parallel
read-only audits + mechanical greps over all 39 charts × static/interactive/gallery/docs).**
Findings + resolution (memory `chart-legibility-and-review-practices` updated with the
invariants so these can't recur):
- **`--mc-band` used as a STROKE color** (8%-alpha ≈ invisible): FIXED heat-strip:82 +
  calendar-strip:147 (empty cells — broke the "empty ≠ zero" flagship), rug-strip:117
  (empty axis), event-timeline:189 (track) → `var(--mc-neutral)` @0.35–0.45.
- **calendar-strip real ZERO days** rendered at `stepOpacity(0)=0.06` (invisible) → floor
  0.14 so present-but-zero reads distinct from empty.
- **Primary-mark stroke-width hardcoded** (thinner than peers, ignores presets/forced-colors):
  FIXED slope:174,186, percentile-ladder:194, micro-box:172 → `var(--mc-stroke-width)` /
  `calc(...*k)`. (rug ticks, ohlc wicks, dumbbell rings left — intentional secondary hairlines.)
- **sparkbar interactive re-implemented the SVG** → win-loss ties colored green, annotations
  dropped, endpoint label absent. FIXED: client now COMPOSES `<StaticSparkBar summary={false}
  style={FILL}>` (Chart forwards style, so fluid sizing survives); overlay focus ring as a
  child. Regression test added (tie stays `bar`). This is the canonical pattern; the other 34
  clients already compose.
- **Docs interactive demos duplicated data** (drift class): seismogram.client had stale sparse
  data while the registry was dense → now `export const BURSTS` from the registry, imported.
  (Other 34 currently match; pattern established.)
- **Demo CSS-sizing traps** → props: mini-bar playground, ohlc.mdx ×3, event-timeline.mdx,
  micro-donut.client; pictogram-row inline-em aspect matched to kill letterbox.
- **graded-band.mdx** was truncated → added Four homes / Why this default / Accessibility / Props.
- **Gallery (reference, stale vs correct impls)**: renamed `tufte`→`editorial` theme
  (non-negotiable #6), dropped the cancelled `@microcharts/expressive` claim, fixed 6 family
  counts (96→100), fixed fCalibrationStrip negative-height slivers, redrew bumpstrip as a STEP
  (its own honesty claim), fixed likert left-side opacity grading.
- **False positives caught by verifying first** (agents erred): graded-band "RED test" (passes
  24/0), dot-plot "of 3 drift" (real library string), icon-array "loose --mc-neg" (uses full
  `--mc-negative`). No changes made to these.
- **NOT touched — benchmark-strip** (P1 band/label findings real) is under a concurrent
  session's edit (showed modified on a clean-start tree); left to avoid clobbering.
- **Deferred** (spawned task): ~14 cosmetic gallery renderer refreshes where the impl is
  already correct (ohlc/progress-ring/funnel/status-dot/trend-arrow/dumbbell/pictogram/coverage/
  slope/stacked-area/heat-strip/segmented/micro-donut/paired-bars/waterfall/micro-box) + the
  forced-colors system-color mapping for custom ink roles (unit/unit-off/gap/flag), which needs
  moving their color from inline to CSS first.
- Gates after fixes: node 1068, browser 75, craft 172/0, tsc (lib+docs), size (no fails),
  docs 88. Argos baselines for the touched static charts must be re-approved.

**Label size follow-up (2026-07-08, second user review).** The `--mc-label-size` pin
(above) fixed overlaps but I pinned it to a FIXED viewBox-unit value (4.5–6) that rendered
~HALF the size of the older charts (which use the shared `0.75em` ≈ 10.5px). Measured old
vs new in-browser: Progress/HeatCell labels = 10.5px, mine = 4.5–6px. Fix: size labels
proportional to chart height — `FONT = clamp(round(height·0.62), 7, 11)` for the strips,
`clamp(round(height·0.5), 6, 9)` for PercentileLadder (3 labels share the track) and
`clamp(round(height·0.5), 7, 10)` for IconArray (the grid stays the hero). This matches the
old ~10.5px at typical sizes AND stays chart-proportional (better than the ambient `0.75em`,
which shrinks relative to a larger chart). All gutter/spread math is driven by the same FONT
so containment stays exact; the PercentileLadder `log`-tag gutter is now font-sized (was a
fixed 11 units → collided with p50 once the font grew). IconArray default bumped 60×24 →
140×28 (the old 60px default was too narrow for a properly-sized ratio label + 20-cell grid).
percentile-ladder trimmed the log-fallback `devWarn` to stay under the 3 kB hard cap.

**Band invisibility — the unifying attribute-vs-CSS bug (2026-07-08, third user review).**
BenchmarkStrip and GradedBand bands rendered near-invisible AGAIN after the ink-role refactor.
Root cause is the SAME class as the font-size bug, now for `fill`: the band rects carry
`data-mc-ink="band"` (kept for the craft/overlap + forced-colors exemption), whose
`:where([data-mc-ink=band]){fill:var(--mc-band)}` rule (~8% alpha) OVERRODE the
`fill="var(--mc-neutral|accent)"` ATTRIBUTE — an SVG presentation attribute loses to any
`:where()` CSS even at 0 specificity. So bands rendered at ~8% × their `fillOpacity` ≈ 1–3% =
invisible. FIX: set band fill via inline `style={{ fill, fillOpacity }}` (specificity 1000, wins),
keeping `data-mc-ink="band"` only for the exemptions. Verified via `getComputedStyle`: benchmark
bands now `--mc-neutral` 0.16/0.34, graded `--mc-accent` 0.14/0.26/0.38 — visible + distinct.
**General rule for the rest of the batch: any COMPUTED color/size goes in inline `style`, never a
`fill`/`stroke`/`font-size` attribute, on any element carrying `data-mc-ink` or on `<text>`.** The
SSR craft gate (color-blind, attribute-reader) cannot catch this class — a real-browser
`getComputedStyle` band-opacity check is now part of the mandatory pre-done sweep (see memory).

**BenchmarkStrip label moved OUT of the band (2026-07-08, fourth user review).** The percentile
label sat beside the dot, OVER the peer band, colored like the dot (accent). At ~7px, accent text
over the neutral gray band was low-contrast + cramped (worse in dark). Moved it OUT to a reserved
right gutter (like CoverageStrip's percent): `gutterCh:4` → `totalWidth=width+gutter`, end-anchored
at `labelX`, still colored like the dot so it stays tied to the focal value. The client passes the
same gutterCh/font so its `totalWidth` matches (pointer math). GradedBand's `22` stays in-band — a
dark `data-mc-ink="label"` over its pale accent band reads fine. Rule: a mark-colored label over a
same-tone band → gutter it; only dark-over-pale may stay in-band.

## Batch 2 wave 2 — RateVolume (2026-07-08)

**RateVolume (plan/23 §5) — full DoD, static + interactive.** Provenance: plan/16 §Q16;
the "always show the denominator" thesis is design-principle (honest-encoding non-negotiable
#7), not an empirical study — no external claim asserts otherwise. Ghost bars have NO removal
prop by design (a rate without its volume is the lie the type prevents).

**Deviations from the plan §5 spec (all deliberate, none change the data story):**
- **`curve` dropped `"smooth"`.** Spec lists only `"linear" | "step"`. A smooth (Catmull-Rom)
  rate line would imply between-period rate values that were never measured — dishonest for a
  per-period rate. Dropping `smoothPath` also trimmed the static ~0.14 kB (2.73 → 2.59 kB).
- **`unit?: string` prop added (default `"events"`).** The summary template requires a volume
  noun (`… on 38 events …`); the spec's example hard-codes "events" but lists no prop. One
  minimal prop keeps it i18n-able and per-instance ("orders", "sessions").
- **Interactive announce = `"Period N of M: …"`**, not the spec example's `"March: …"`. The
  data shape carries no period labels, so an index is the honest identifier (matches OHLC/stack/
  vs). The summary uses the template's literal "across N periods" (the spec example's "12 weeks"
  was illustrative; the template string says "periods").
- **Static budget 2.55 kB > spec §5 target 2.5 kB** (Chart wrapper + scale + line/step path +
  strings floor), interactive 3.42 kB (spec 3.5). Both UNDER the 3/4 kB hard caps. Budget set to
  measured + headroom (2.6/3.5). Same budget-floor class as W1; needs user sign-off at the gate.

**New `data-mc-ink="ghost"` ink-role** (`styles.css`): the volume denominator, static neutral
fill at 0.18 opacity, with a forced-colors mapping to `GrayText` (stays quiet background context,
never competes with the rate line). Static color lives in the CSS role (not inline) to earn that
mapping — same discipline as `gap`/`unit-off`.

**Two craft bugs the SSR gate missed, caught by the mandatory real-browser getBBox sweep:**
1. **`round2` on the DATA values destroyed fractional-rate precision.** The geometry rounded
   `last.rate`/`firstRate` to 2 dp (correct for COORDINATES, wrong for values used in labels +
   summary): a percent-fraction rate `0.041` collapsed to `0.04`, so the endpoint label rendered
   **"4%" instead of "4.1%"** and the reserved gutter was mis-sized. FIX: rate/volume are data
   values — never coordinate-rounded; only x/y/width/height are. Lesson for any chart whose data
   are small fractions: `round2` is for pixels, never for a value you will format.
2. **Endpoint label escaped the viewBox.** (a) The gutter char-width over-estimate `0.62·em`
   undershoots the wide `%` glyph → horizontal escape; bumped to `0.72·em`. (b) A label tracking
   the endpoint's Y escaped top/bottom at rate extremes — the endpoint readout is now vertically
   centered in the gutter (`labelY = height/2`, central baseline), a cleaner "current value"
   readout that never escapes. Sweep after fix: 0 escapes, 0 text-on-mark, ghost fillOpacity 0.18,
   label 11px (matches the old ~10.5px reference).

**Docs circular-import TDZ trap.** `rate-volume.client.tsx` imports the shared `DEMO` from its
registry parent `rate-volume.tsx`, which in turn imports `InteractiveDemo` from the client — a
cycle. Computing `const FRAC = DEMO.map(...)` at the client's MODULE TOP LEVEL ran during the
parent's mid-initialization (before its `DEMO` const executed) → `ReferenceError: Cannot access
'f' before initialization` at static-export time (crashed the build, and knocked out delta's page
too via the shared chunk). FIX: touch the imported data only INSIDE the component body, never at
client module top level (seismogram.client already did this — the rule was implicit). Pattern for
every shared-DEMO docs client.

## Batch 2 wave 2 — NetFlow (2026-07-08)

**NetFlow (plan/23 §6) — full DoD, static + interactive.** Provenance: plan/16 §Q14. The
"one shared scale for both directions, both areas anchor at zero" rule is the honest-encoding
non-negotiable (#7 / plan/06 lie-factor=1), not an empirical claim.

**Deviations from the plan §6 spec (deliberate):**
- **`stack.ts` NOT used.** The spec's "new core needs: stack.ts zero-anchored helpers" assumed
  `divergingStack` would model the mirror. It doesn't — `divergingStack` splits ONE valenced
  distribution at a neutral pole (Likert-shaped), not a per-period bidirectional time series.
  The honest primitive is a symmetric magnitude `scaleLinear` + a zero-anchored area, so NetFlow
  builds those directly. No kernel change needed; `divergingStack` stays for LikertStrip et al.
- **Area path built inline (no `core/areaPath`).** `areaPath` references a `TOP` curve map that
  holds `smoothPath`+`stepPath`, so importing it drags both into the bundle even for linear-only
  areas (~0.5 kB dead). NetFlow's areas are linear (a rate/flow area must not smooth), so a
  6-line inline `zeroArea` (baseline→tops→baseline→close) using only `linePath` keeps it lean.
  Trimmed static 2.88 → 2.61 kB.
- **Tokens corrected from the spec.** plan §6 names `--mc-pos`/`--mc-neg`/`--mc-fg` and
  `data-mc-ink="area"` — none exist. Areas use the real `positive`/`negative` ink-roles (which
  ALSO give the forced-colors CanvasText-vs-GrayText distinction for free) with `fillOpacity`
  dialed inline; the net line is `data-mc-ink="data"` (= `--mc-stroke`). Direction is never
  color-alone: position (in above / out below zero) + the signed net in the label's TEXT are the
  redundant channels. `positive="down"` swaps only the valence COLOR mapping (color = which
  direction is good, position = in/out identity — two independent channels).
- **Static budget 2.61 kB > spec §6 target 2 kB** (Chart wrapper + scale + linePath + strings
  floor), interactive 3.41 kB (spec 3). Both UNDER the 3/4 kB hard caps. Same budget-floor class
  as the rest of batch 2; needs user sign-off at the gate.
- **Interactive announce = "Period N of M"** (no period labels in the data shape), summary
  "across N periods" — same rationale as RateVolume.

Gates: node 1122, browser 80, craft 196/0, size 2.61/3.41, bench 18.4 rows/ms (floor 8),
docs build 168 pages + docs tests 92, tsc/oxlint/oxfmt/knip clean. Real-browser sweep: 0
escapes / 0 text-on-mark, areas visible (0.2 area / 0.45 bars), mirror confirmed (inflow above
zeroY, outflow below, both anchored at zero), interactive pairs gross + signed net.

## Batch 2 wave 2 — RetentionCurve (2026-07-08)

**RetentionCurve (plan/23 §7) — full DoD, static + interactive.** Provenance: plan/16 §Q12.
The locked-[0,1]-domain + step-default rules are honest-encoding (non-negotiable #7 / plan/06),
not empirical claims. **Plateau criterion** (mean |Δ| over the last `max(3, ⌈n/3⌉)` periods <
0.005 = 0.5 pts/period) is a chart-local documented heuristic, property-tested: no plateau on a
still-decaying tail, plateau on a flattened one, `from` = the window's first period.

**Deviations from the plan §7 spec (deliberate):**
- **Tokens corrected.** plan §7 names `--mc-muted` and `data-mc-ink="ghost"`; the ghost is a
  dashed LINE (stroke) so it uses `data-mc-ink="muted"` (= `stroke:var(--mc-neutral)`) + dash,
  NOT the fill-only `ghost` role added for RateVolume. Line = `data-mc-ink="data"` + inline
  accent stroke (accent is the hero series, forced-colors keeps the tokenized width).
- **`unit?: string` prop added (default "period").** The summary needs a period noun
  ("weeks"/"week"); the spec example hard-codes "week" but lists no prop. English pluralization
  (`${unit}s`) lives in the EN module.
- **Interactive announce uses the 0-based period index** ("week 0" = cohort start), not "Month
  3" — retention period 0 is the 100% signup point, so the index IS the honest period label.
- **Static budget 2.64 kB > spec §7 target 2 kB** (Chart wrapper + scale + step/smooth paths +
  strings floor), interactive 3.43 kB (spec 3). Both UNDER 3/4 hard caps. `smoothPath` is
  bundled because `curve="smooth"` is a documented variant. Same budget-floor class; gate sign-off.

Gates: node 1148, browser 82, craft 208/0, size 2.64/3.43, bench 40.1 rows/ms (floor 12), docs
build 171 pages + docs tests 94, tsc/oxlint/oxfmt/knip clean. Real-browser sweep: 0 escapes / 0
text-on-mark, accent line + dashed ghost + step confirmed, plateau marker present only when flat
(still-leaking curve → 0 markers), retention 1.0 anchored at the top of the locked frame,
interactive pairs retention + benchmark.

## Batch 2 wave 2 — BurnChart (2026-07-08)

**BurnChart (plan/23 #8) — full DoD, static + interactive.** Provenance: plan/16 §Q11. The
dotted-provisional-projection + stated-fit-method rules are honest-encoding (non-negotiable #7),
not empirical. **Projection method:** linear least-squares slope over the last `max(2, ⌈today/3⌉)`
actual points; a non-decreasing recent slope (mode=down) → the projection never reaches 0 → no
landing, summary "not finishing at the current pace". Property-tested (behind/ahead/flatlined).

**Deviations from the plan §8 spec (deliberate):**
- **Tokens corrected.** plan §8 names `--mc-muted`/`--mc-fg`/`data-mc-ink="ghost"`; the plan line
  is `data-mc-ink="muted"` (dashed), the actual `data-mc-ink="data"` + inline accent, the
  projection inline accent + dotted + 0.65 opacity (provisional). The gap label is valence-colored
  (`--mc-negative` late / `--mc-positive` early) with the SIGN in text (never color-alone).
- **`work`/`unit` props added** (default "points"/"day") — the summary needs both nouns; the spec
  examples hard-code them.
- **Gap label = schedule days** ("+2 d"), the "will we finish on time" answer; suppressed when the
  burn flatlines (no landing). Interactive announce uses 0-based day index + a "(projected)" clause
  in the extrapolation region.
- **Static budget 2.82 kB > spec §8 target 2 kB**, interactive 3.7 kB (spec 3). Under 3/4 hard
  caps. Same budget-floor class; gate sign-off.

## Batch 2 wave 2 — MISSING VISIBLE HOVER READOUT (2026-07-08, user screenshot review)

All four wave-2 interactive charts (RateVolume/NetFlow/RetentionCurve/BurnChart) shipped with ONLY
the visually-hidden `aria-live` region and no on-screen value readout — hovering showed a crosshair
+ focus ring but no number. The `.mc-spark-readout` chip (opaque surface, `--mc-surface*` tokens) is
a GLOBAL zero-specificity style; the fix renders it in each client, positioned at the active point's
`left: (x/totalWidth)*100%`. Concise per chart (rate·volume / in·out·net / value·benchmark /
value). Browser tests now assert the chip text so it can't regress. Memory updated
(chart-legibility-and-review-practices): the visible readout is part of the interactive DoD, not
optional. Interactive budgets rate-volume 3.5→3.55, burn 3.75→3.8 kB (readout markup, ~10 B).

## PercentileLadder ratio Infinity flake fixed (2026-07-08)

An intermittent property-test failure (`containment: ratio finite`, ~1 in 3 runs) surfaced
while building wave 2. Root cause in `percentile-ladder/geometry.ts`: `ratio` guarded the RAW
quotient's finiteness (`Number.isFinite(quotient)`) but then passed it through `round2`, which
multiplies by 100 FIRST — so a finite-but-huge quotient from denormal fuzz inputs (e.g. a p50
of 5e-324 → p99/p50 ≈ 1.8e306, ×100 = 1.8e308 > Number.MAX_VALUE) overflowed to Infinity past
the guard. Fix: guard the ROUNDED result (`const r = round2(quotient); ratio = isFinite(r) ? r
: 0`). Added a deterministic regression test with the shrunk counterexample. Lesson: `round2`
(×100 then round) is safe for BOUNDED coordinates but can overflow on an unbounded data-derived
value — guard after rounding, not before. (The wave-2 charts don't hit this: their round2 sees
only bounded coords + raw values, and burn's projection guards `Number.isFinite(finishPeriod)`.)

## Batch 2 wave 2 — ErrorBudget (2026-07-09)

**ErrorBudget (plan/23 #9) — full DoD, static + interactive.** Provenance: plan/16 §Q10; the
1×/6×/14.4× multiwindow burn-rate multiples are the Google SRE Workbook CONVENTION (labeled as
such in docs), never universal law — `rates` is configurable. `currentRate` = observed slope
over the last `max(2, ⌈n/6⌉)` steps ÷ steady, documented + property-tested.

**Deviations from the plan §9 spec (deliberate):**
- **Reference lines, not filled tinted wedges.** plan §9 asks for "stepped faint tint" regions
  between successive rate lines. At 80×20 a filled diverging tint muddies the read; the burn-rate
  references render as faint dashed hairlines (via `data-mc-ink="muted"` + low opacity, reusing
  the forced-colors GrayText mapping — there is no `region`/`ghost` ink-role, and the plan's
  names don't exist). The gallery sketch (`qErrorBudget`) also shows only lines. Honest + legible.
- **`window` prop added.** The plan geometry signature is `{data, rates, pad}`, but "day 12 of
  30" needs the full window length to place "now" mid-window; without it the actual line always
  spans to the right edge. `window` defaults to `data.length` (line spans full width = "at window
  end", matching the gallery).
- **`unit` prop added** (default "day") for the summary noun.
- **Static budget 2.41 kB** (lean — just linePath + clamp, no quantile), interactive 3.27; both
  under caps and near the §9 target of 2 kB.

**labelY clamp fix (caught by the real-browser sweep):** a 0%-remaining (exhausted) budget puts
the endpoint at the bottom edge; the tracking label escaped because the clamp bottom margin was
`fontSize*0.3` — a central-baseline box spans ≈ ±0.55·fontSize, so it's now `height -
fontSize*0.6`. 0 escapes after. Same class as the RateVolume label-escape lesson.

Gates: node 1191, browser 86, craft 232/0, size 2.41/3.27, bench 30.8 rows/ms (floor 12), docs
177 pages + tests 98, real-browser sweep green (diagonal + faint burn-rate lines + exhaustion ✕
+ danger-colored endpoint/label all confirmed; readout chip "62% · 0.6×" visible).

## Batch 2 wave 2 — ControlStrip (2026-07-09)

**ControlStrip (plan/23 #10) — full DoD, static + interactive.** Provenance: plan/16 §Q9. The
σ̂ = MR̄/1.128 individuals estimator is stated + property-tested (a constant-MR series gives the
exact ±3σ̂ limits); sample SD is deliberately NOT used (inflates limits under drift). WE rules
are the enumerated Western Electric subset — WE-1 (beyond 3σ, always), WE-2 (2-of-3 beyond 2σ
same side), WE-4 (8 on one side); WE-3 excluded at micro scale (flag density = noise, documented).

**Deviations / decisions:**
- **Tab does NOT cycle violations** (plan §10 interactive suggested it). Trapping Tab breaks
  keyboard focus egress (a11y regression); ←/→ steps all points, violations are visible as rings.
- **`limits="percentile"`** pulls `core/quantile` (Batch 0) — the only kernel dep, adds ~0.15 kB;
  static 2.68 / interactive 3.56 kB (budgets 2.8/3.7), under 3/4 hard caps. Same budget-floor class.
- Band uses the standard `--mc-band` token (8% alpha, verified visible-but-faint); provisional
  (n<10) band adds a dashed neutral border; degenerate (MR̄=0) collapses to the center hairline.

Gates: node 1220, browser 88, craft 244/0, size 2.68/3.56, bench 51 rows/ms (floor 12), docs 180
pages + tests 100, real-browser sweep green (band faint, out-points ringed-neg, all-dots, dashed
provisional band all confirmed; readout chip "73" visible, out-points announce the crossed limit).

## Batch 2 wave 2 — ForecastCone (2026-07-09)

**ForecastCone (plan/23 #11) — full DoD, static + interactive.** Provenance: plan/16 §Q1. The
three honesty rules are enforced, not offered: ≤ 2 bands (a 95% band reads as false tail
confidence at micro scale), median always dashed (an estimate never renders as fact), and a
non-widening cone is flagged (`widening: false`, property-tested) and rendered AS GIVEN — never
auto-inflated. Reversed `[hi,lo]` pairs swapped; empty history → cone-only cell.

**Deviations / decisions:**
- **`softEdge` and `curve` variants DEFERRED** (plan §11 lists them, shared vocab). They are
  cosmetic — the chart's honesty rules (bands/dashed/widening) are all implemented, and history
  is linear + the outer band is a hard-edged polygon. Adding a soft halo + smooth/step history
  costs size/complexity for no decision value at micro scale. Logged here; add later if wanted.
- **Clearance polarity = higher-is-target** (band lo ≥ target → clears, hi ≤ target → misses,
  else straddles). No polarity prop; documented. A "stay under" threshold reads inverted — a
  `positive` prop could refine it later.
- **Static budget 2.83 kB > spec §11 target 2.5** (two band polygons + history + dashed mid +
  strings), interactive 3.71 kB (spec 3.5). Under 3/4 hard caps. Same budget-floor class.

Gates: node 1246, browser 90, craft 256/0, size 2.83/3.71, bench 23.2 rows/ms (floor 10), docs
183 pages + tests 102, real-browser sweep green (nested bands 0.13/0.24, dashed accent median,
region-aware announce + readout chip "42 · 33–55" confirmed). NOTE: graded-band/micro-donut/ohlc
bench floors flake under machine load (dev server + parallel builds) — environmental, they pass
clean; the calibrated ~half-baseline floors are a touch tight for a loaded machine.

## Batch 2 wave 2 — QuantileDots (2026-07-09)

**QuantileDots (plan/23 #12) — full DoD, static + interactive.** Provenance: plan/16 §Q2.
Quantile dotplot via `core/quantile.quantileDotplot` (Kay/Fernandes binning, Batch 0). Each dot
is an equal-probability quantile (≈ 1-in-count chance), NOT a raw observation; past-threshold
dots are re-inked accent AND ringed (`stroke` = shape cue, never color-alone); summaries use
frequency framing ("N in count"), never a bare percentage (plan/16 rule #3). count capped at 25.

**Audit flag (mandatory, plan/23 honesty note).** The studied quantile-dotplot design (Kay 2016;
Fernandes 2018 — 97%-of-optimal decision quality) used **50 dots**. The 15–20 default here is a
countability judgment at micro scale (subitizing clusters in ≤200 px), NOT a validated
equivalence to the 50-dot result. Classification: **inferred-from-adjacent-research** — the
frequency-framing + quantile-dot ENCODING is studied; the specific low dot count is a design
call. Docs recommend 15–20 and state "each dot ≈ a 1-in-count chance". Open question stands
(plan/23 §Batch-level risks): validate 15–20 at micro scale or document as a deliberate tradeoff.

**Interactive = the probe** (distinct from nearest-x): pointer x sets a LIVE threshold, the count
past it recomputes purely; ←/→ nudge one bin, Esc resets to the prop threshold. The probe value
is clamped to the data range AND rounded 2-dp (a raw pointer-derived float read as
"9.7698…min"). Static accessible name reflects the PROP threshold (documented default), not the
transient probe.

**Chunk-isolation fix caught by size-limit.** I first added `quantileDots`/`quantileDotsRange` to
`strings-freq` (shared with IconArray) — that taxed IconArray's interactive bundle +2 B, tipping
it over its 3 kB budget. Split into its OWN `strings-quantile-dots` module (`EN_QUANTILE_DOTS`);
IconArray back under budget. Reinforces the per-family-module rule: never add keys to a shared
strings chunk that another chart already imports at its budget edge.

Gates: node 1272, browser 92, craft 268/0, size (quantile-dots 2.51/3.3, icon-array back under),
docs 186 pages + tests 104, real-browser sweep green (20 dots, flags re-inked+ringed, "10 in 20"
label, probe recomputes + rounds clean, 0 escapes).

## Batch 2 wave 3 — ABStrips (2026-07-09, branch batch-2-decision-w3)

**ABStrips (plan/23 #13) — full DoD, static + interactive.** Provenance: plan/16 §Q6. Two graded
quantile strips (p5–95 / p25–75 / median) on ONE shared scale via `core/quantile.quantiles`
(NOT by importing GradedBand — geometry reused via the kernel, per spec). The middle-half OVERLAP
is always computed + always in the summary (overlap is the honest answer — plan/16); never a bare
mean bar. Edge cases property-tested: identical → overlap 1 / "no clear difference"; disjoint →
overlap 0 / "clearly separated"; n < 8 arm → min–max outer band (BenchmarkStrip small-n rule).

**Craft-vs-browser lesson (reinforced).** The A/B row tags sit at the two row centers, only
`height/2` apart. The SSR craft gate (attribute-based text-extent estimate) passed `FONT=8` at
80×20, but the real-browser getBBox showed the tags OVERLAP (a 7-8px label in a 9px row gap).
Dropped to `FONT = clamp(round(height·0.3), 6, 8)` (→6 at h20); browser re-verified 0 tag
overlaps. **The mandatory real-browser sweep caught what craft could not — again.** (`dots`
quantile-dot-row variant deferred: needs ≥28px height; the band form is the honest default here.)

**Deviations:** `dots` variant deferred (cosmetic, height-gated); clearance/delta polarity via
`positive` (higher-is-good default; sign always in text). Static 2.56 / interactive 3.49 kB
(budgets 2.7/3.6) — under 3/4 hard caps, same budget-floor class.

Gates: node 1287, browser 94, craft 280/0, size 2.56/3.49, bench 24.9 rows/ms (floor 20), docs
189 pages + tests 106, real-browser sweep green (2 nested bands/row 0.16/0.34, medians, A/B tags
no-collision, delta valence-colored, row+edge interactive + readout chip). Starts wave 3.

## Batch 2 wave 3 — ShiftHistogram (2026-07-09)

**ShiftHistogram (plan/23 #14) — full DoD, static + interactive.** Provenance: plan/16 §Q7. Two
mirrored histograms over SHARED bin edges (`core/bin.uniformBins`, union domain + one auto bin
count reused for both sides). Heights = per-side PROPORTIONS on one shared scale (max proportion
across both) — property-tested: identical distributions at 10× the n produce matching up/down
heights (unequal n cannot fake a shift). Median shift is the precise takeaway; medians never
smoothed/trimmed. One side empty → single histogram + "no <side> sample"; unequal n → summary
carries both.

**Two fixes caught during the build:**
1. **Static 3.02 kB was OVER the 3 kB HARD cap** (imported both `core/bin` AND `core/quantile`).
   Trimmed by computing the two medians INLINE (5-line sort + middle) instead of pulling the whole
   quantile module for one 0.5 quantile → 2.94 kB, under the cap. Lesson: a histogram bundle
   should not drag the quantile module for a single median.
2. **Side tags ("before"/"after") collided with the bars at EVERY micro size** — the craft gate
   caught 8 TEXT-ON-MARK/ESCAPE issues (full-word tags over the full-width bars, no clear space).
   DROPPED the on-chart tags: side identity rides on POSITION (before up / after down) + color +
   the summary, and position survives grayscale + forced-colors (both bars map to CanvasText, but
   up≠down still distinguishes). This is the plan's "drop first under the degradation order",
   applied always at these sizes. Deviation from plan §14 (which lists side tags) logged here.

Gates: node 1303, browser 96, craft 292/0, size 2.94/3.88, bench 13.4 rows/ms (floor 6), docs 192
pages + tests 108, real-browser sweep green (proper mirror before-up/after-down, overlay outlines,
"0 ms" no-shift, 0 escapes; interactive bin proportions + M-jumps-to-median + readout chip).

## Batch 2 wave 3 — ParetoStrip (2026-07-09)

**ParetoStrip (plan/23 #15) — full DoD, static + interactive.** Provenance: line 150 (ASQ Pareto
procedure; 80% a reference, not a law — CORROBORATED). Descending bars + a cumulative-share line
on a **FIXED 0–100% scale spanning the full plot height** (never rescaled to steepen the curve —
the classic Pareto lie). The accent stops at the threshold crossing (the vital few); the rest are
muted — the chart's one job is "where do I stop reading". `Other` rolls the tail beyond `max`,
renders honestly at true size, but is always last and **never eligible to be the crossing**.
Real accessible name: **"Top 4 of 9 causes account for 82% of incidents."** (`threshold=false` →
"Timeouts leads at 39%."; zero total → "No recorded incidents."). Interactive steps bars
(share + running cumulative announce + `%·%` readout chip); **T** jumps to the crossing bar.

**Honest edge caught in the real-browser sweep:** with `max` small enough that the head's top
non-Other bars don't reach the threshold (top-3 = 79.4% < 80%, and `Other` = 20.6% would cross but
is excluded), there is **no crossing → no vital accent, no "K of N" label** — the summary falls back
to `paretoTop` ("top leads at X%"). This is correct and honest: if the shown causes don't get you to
80%, the chart must not paint a fake vital few. Docs note it usually means `max` is too aggressive.

**Typing fix:** the crossing was first computed by mutating a `{index,x}|null` inside a `rows.map()`
callback — TS control-flow analysis can't track callback mutation and narrowed it to `never`
(TS2339 "Property 'index' does not exist on type 'never'"). Restructured to a plain loop computing
`cums[]` + `crossingIndex`, deriving `crossing`/`vitalCount`/`cumAtCrossing`/`line` from it. Lesson:
never mutate an outer typed accumulator from inside a `.map()` — compute the index in a loop first.

**MDX trap:** the accessibility prose used literal `<top>`/`<share>` placeholders — Fumadocs MDX
parsed them as JSX tags ("Expected a closing tag for `<share>`") and `next build` failed though
`pnpm test` was green. Reworded to plain words. Same class as the docs circular-import TDZ: a docs
build is the only gate that catches MDX/Node-eval errors.

Gates: node 1320, browser 98, craft 304/0, size 2.23/3.04 (well under caps), bench 25.1 rows/ms
(floor 6), docs 195 pages + tests 110, real-browser sweep green (accent stops at crossing across
default/rollup/no-threshold, cum line + threshold hairline present, rollup-below-threshold correctly
shows no vital few, 0 escapes/overlaps; live hero label == mdx, interactive announce + T-jump +
readout chip). **11 of 21 done.**

## Batch 2 wave 3 — DataDiff (2026-07-09)

**DataDiff (plan/23 #16) — full DoD, static + interactive.** Provenance: plan/16 §Q17. One diverging
bar per key — removed leftward (`--mc-negative`), added rightward (`--mc-positive`), **both always
drawn on ONE symmetric shared scale** (max(added,removed) across all rows), so a +500/−480 churn can
never look like a +20/−0 trickle (property-tested). `labels` (in-chart key tags), `net` (a tick at
added−removed — a summary mark, never a stand-in for the bars), `sort` (`"none"` keeps input order,
which is often meaningful), `label="totals"` (a `+added / −removed` footer), `domain` (shared scale
for cross-chart comparison). Negative counts are magnitudes → clamped to 0; a 0/0 key keeps a
hairline placeholder tick (absence of change ≠ absent key); >12 rows warns via `core/dev.devWarn`
and steers to a table of DataDiffs — never silent truncation. Real accessible name: **"+512 added,
−187 removed across 6 keys; largest change: users (+220)."** (largest by |net|, signed; all-zero →
"No changes across N keys."). Interactive = pointer-y/↑↓ grid lookup over rows, announcing each key's
added/removed/net + a `+added · −removed` readout chip.

**The important craft fix — CSS var beats the font-size ATTRIBUTE in the browser.** Key tags at many
rows first escaped/overlapped. Fit-gating helped (tags only when a row clears ~10 px; tag font ≤
0.5·rowH; totals footer reserves its own bottom band and only appears at height ≥ 34), and the SSR
craft gate (which reads the `font-size` **attribute**) went green — but the **real-browser** sweep
still showed 5 tag-tag overlaps, with `getBBox().height` frozen at ~11.5 no matter the attribute.
Cause: `styles.css` has `:where(.mc-root text){ font-size: var(--mc-label-size) }`, and a CSS
declaration **beats a presentation attribute**, so every tag was pinned to `--mc-label-size` (=FONT)
regardless of `fontSize={tagFont}`. Fix: set the tag size **inline** (`style={{ fontSize: tagFont }}`)
— inline style beats the zero-specificity `:where` rule. Lesson (amends the memory note "fontSize as
an attribute"): the attribute is enough only when a chart's text is ALL one size == `--mc-label-size`;
a chart with a SECOND, smaller text size must set it inline, and only the real-browser getBBox sweep
catches the miss (SSR craft reads the attribute and is blind to it).

**Also:** playground toggle knob kind is `"toggle"`, not `"boolean"` (typecheck at docs build caught
it); `format` prop must be typed `Format` (from `core/format`), not `string`; MDX prose avoided
literal `<key>` placeholders (the ParetoStrip `<share>` trap).

Gates: node 1342, browser 100, craft 316/0, size 2.5/3.32 (caps 2.7/3.55), bench 25.9 rows/ms
(floor 20), docs 198 pages + tests 112, real-browser sweep green (all 13 data-diff SVGs on the live
page 0 escapes/0 text-on-mark/0 tag-tag; both bars always drawn; 0/0 placeholder tick; labels/totals
degrade cleanly at small sizes; live hero label == mdx; interactive row announce + readout chip).
New `EN_DATA_DIFF` module (`dataDiff`, `dataDiffEmpty`, `dataDiffAt`). **12 of 21 done.**

## Batch 2 wave 3 — QuadrantDot (2026-07-09)

**QuadrantDot (plan/23 #17) — full DoD, static + interactive.** Provenance: plan/16 §Q18. A focal
dot placed by 2-D position against a peer field, a hairline cross at the split (default = domain
midpoints, always overridable but NEVER hidden), a faint accent tint on the focal's quadrant, tiny
muted ghost dots for peers. The read is quadrant MEMBERSHIP first (exact position second) — so it
lives at glyph scale (24×24) with **no in-chart text**: axis meaning rides entirely on `title` +
summary, and the docs name skipping them the one anti-pattern. Boundary rule `≥ split ⇒ right/top`
(property-tested, deterministic on-the-line). A degenerate axis centers the focal and suppresses that
split line (`scaleLinear` already maps a zero-span domain to the midpoint). `xDomain`/`domain`
(x/y per grammar — a 2-D chart earns the extra `xDomain`), `split`, `field`, `quadrants` (names in
TL/TR/BL/BR reading order, **summaries only, never rendered**), `xLabel`/`yLabel`, `region` (tint
off for dense grids). Real accessible name: **"Impact 9, effort 3 — in the high-impact, low-effort
quadrant (2 of 14 peers)."** (generated axis-relative wording via `quadrantName`, or explicit
`quadrants`). Interactive cycles peers NEAREST-FIRST from the focal (sorted in geometry), each read
with coords + quadrant + a `x, y` readout chip; pointer picks the nearest dot within a 3-unit hit
radius.

New role `data-mc-ink="region"` (accent 5% tint, drops to `transparent` under forced-colors — it's
decorative; membership is carried by dot position + summary). Reused the existing `ghost` role
(neutral 0.18) for peers. No new escapes class — the glyph has no text, so the real-browser sweep
checks dot containment + region opacity + cross/ghost counts only.

**Budget divergence (needs gate sign-off, batch-2 pattern):** spec §17 targets static ≤ 1.5 kB /
interactive ≤ 2.5 kB, but measured 2.17 / 3.05 kB (Chart wrapper + `scaleLinear` + `extent` +
`makeFormatter` + the quadrant summary machinery). Under the 3 / 4 kB HARD caps; budgets set to
2.4 / 3.3 with headroom. Trimming to 1.5 would mean dropping the formatter or the summary — not worth
the honesty cost. Same class as RateVolume/NetFlow/etc. spec-vs-measured gaps logged above.

Gates: node 1359, browser 102, craft 325/0, size 2.17/3.05 (budgets 2.4/3.3, caps 3/4), bench 22.7
rows/ms (floor 20), docs 201 pages + tests 114, real-browser sweep green (all 13 quadrant-dot SVGs
on the live page 0 dot-escapes; region tint renders at 0.05; lone-glyph → 0 ghosts; no-tint → no
region; live hero label == mdx flagship string; interactive nearest-first announce + `x, y` readout
chip). New `EN_QUADRANT` module (`quadrantName`, `quadrant`, `quadrantLone`, `quadrantAt`).
**13 of 21 done.**

## Batch 2 wave 3 — CyclePlot (2026-07-09)

**CyclePlot (plan/23 #18) — full DoD, static + interactive.** Provenance: plan/16 §Q19 (cycle plot /
seasonal-subseries chart, Cleveland). The flat series is reshaped row-major into `period` slots
(slot = i mod period). Per slot: a muted polyline of that slot's raw values across cycles IN TIME
ORDER + a mean/median tick; across slots the accent spine connects the centers. **The two reads are
separate by construction** (property-tested): the spine is only centers, the local lines are only
raw within-slot values, and **nothing is ever smoothed or joined across a slot boundary** — each
slot's polyline begins and ends inside its own column (verified: every line x ∈ [x0, x1]).
`period` (4–12, `devWarn` outside), `slots` (names for summaries), `center` (`mean`/`median`,
computed INLINE — the ShiftHistogram lesson, no `quantile` import for one median), `trend`
(`line`/`none`), `spine` (off → drift-only), `cycleUnit`. Edge cases: ragged final cycle → per-slot
counts differ and are carried (`slotCounts`); `period ≥ length` → every slot ≤ 1 point, no lines,
spine only; nulls excluded from a slot's center/line, never interpolated; empty slot → spine skips it
(never joins across the gap). Real accessible name: **"Peaks Fri (61), dips Sun (38); Mon rising
across 6 weeks."** — the drift clause appears only when a slot's |drift| leads AND exceeds 10 % of
the spine range, else `cycleNoDrift`. Interactive: ←/→ step slots (mean + cycle count + drift dir),
↑/↓ step the individual observations within the focused slot (a `{slot, cycle}` selection model),
`x`-nearest pointer, value readout chip.

**Budget divergence (needs gate sign-off, batch-2 pattern):** spec §18 targets static ≤ 2 /
interactive ≤ 3 kB; measured 2.44 / 3.46 (Chart + `scaleLinear` + `extent` + `makeFormatter` +
bucketing + summary). Under the 3 / 4 hard caps; budgets set 2.5 / 3.5 with headroom. Same class as
the other batch-2 spec-vs-measured gaps.

Gates: node 1376, browser 104, craft 337/0, size 2.44/3.46 (budgets 2.5/3.5, caps 3/4), bench 21.2
rows/ms (floor 20), docs 204 pages + tests 116, real-browser sweep green (all 13 cycle-plot SVGs on
the live page 0 escapes; 7 ticks + 7 slot lines + spine at default; `trend="none"` → 0 lines; live
hero label == mdx flagship string; interactive slot announce + within-slot cycle announce + drift
direction + readout chip all correct). New `EN_CYCLE` module (`cycle`, `cycleNoDrift`, `cycleAt`,
`cyclePoint`). **14 of 21 done.**

## Batch 2 wave 3 — ChangePoint (2026-07-09)

**ChangePoint (plan/23 #19) — full DoD, static + interactive.** Provenance: plan/16 §Q8. Regime
shading (alternating 3 %/6 % neutral — IDENTITY, not valence) + per-regime mean hairlines + the
series line + break markers (hairline + top triangle). **The detector lives in `geometry.ts`, not
core** (plan/21 §6.0.C), and is a documented HEURISTIC: two-segment mean-shift via binary
segmentation over prefix-sum SS, accepted only when the SS-reduction ratio > `BREAK_SS_RATIO` (0.2)
AND |Δmean| ≥ `BREAK_EFFECT_SIZE` (0.8) × the pooled SD; min segment `max(3, ⌈n/BREAK_MIN_SEG_DIVISOR
(10)⌉)`; recurse to `max`. **All three constants are named exports, docs-stated, property-tested**:
no break on constant / low-noise series (effect-size gate), exact index on a clean step, never more
than `max`. `breaks` (`"auto"` or explicit indices → detection OFF, pure annotation — the recommended
production path), `max` (1–3), `means`, `label="delta"`. `n < 8` → detection off (explicit honoured);
nulls excluded from segment stats + line gaps; gradual ramp honestly finds no shift (named limitation
→ Sparkline, shown in the docs ramp variant). Real accessible name: **"Level shifted up 60% around
point 14 (mean 30 → 48); stable since."** (headline = the largest-|delta| break; tail "stable since"
if it's the last, else "then shifted again"; the direction word carries the sign so the % is
unsigned). Interactive: ←/→ step points (value + regime + regime mean), **Tab cycles the breaks as
first-class stops** ("Break at point 14: mean 30 to 48 (+54%)."), crosshair + value readout chip.

**Budget fight — this chart hit the 3/4 kB HARD caps and had to be trimmed to fit.** The detector +
Chart + scale + line + `makeFormatter` + summary first measured **3.15/4.15 kB — OVER the 3/4 hard
caps** (non-negotiable #2, not just the spec target). Trimmed under by: (1) inlining min/max instead
of the `extent` import; (2) inlining both linear scales (dropped the `scaleLinear` import — replicated
its degenerate→midpoint guard); (3) inlining the null-gap line builder (dropped the `linePath`
import); (4) merging the two percent helpers; (5) dropping the `Stat.n` field; (6) **dropping the
out-of-range-`breaks` `devWarn`** — the geometry still filters them (correct + property-tested), only
the console message is gone. Final 2.93/3.93, under the caps. Deviation logged: the spec lists a dev
warning for out-of-range explicit breaks; it was removed to satisfy the hard cap (behaviour
preserved). Lesson: a chart carrying its own algorithm can blow the per-subpath cap — inline the
kernel helpers it only lightly uses rather than importing them.

**Craft:** the `+60%`/`+54%` delta label escaped the right gutter in the real-browser sweep
(0.62·em/char under-reserves the wide `%` glyph — the RateVolume lesson) → bumped the delta gutter to
**0.72·em/char** (it always carries `%`). SSR craft passed at 0.62; only the getBBox sweep caught it.

Gates: node 1398, browser 106, craft 349/0, size 2.93/3.93 (budgets 2.98/3.98, AT the 3/4 caps),
bench 22.9 rows/ms (floor 12 — the O(n²) segmentation over ≤500 pts), docs 207 pages + tests 118,
real-browser sweep green (all 13 change-point SVGs 0 escapes after the gutter fix; 2/3 regime rects
tile gap-free; break hairline+triangle; live hero == mdx flagship string; interactive point/regime +
Tab-cycles-breaks + readout chip correct). New `EN_CHANGE_POINT` module (`changePoint`,
`changePointNone`, `changePointAt`, `changePointBreak`). **15 of 21 done.**

## Batch 2 wave 3 — EnsembleGhosts (2026-07-09) — BATCH 2 COMPLETE

**EnsembleGhosts (plan/23 #20) — full DoD, static + interactive. The final Batch 2 chart.**
Provenance: plan/16 §Q4 (hypothetical-outcome plots / ensemble spaghetti, Hullman et al.). A faint
bundle of member paths + one emphasised representative, because a mean line hides that futures
disagree in SHAPE, not just endpoint. **Ghost selection is DETERMINISTIC** (`selectGhosts`): members
ranked by endpoint value, picked at evenly spaced quantiles of that ranking — no `Math.random`, no
jitter, so SSR == hydration == every render (property-tested: same input → identical member set).
`ghosts` (default 8, cap 12), `emphasis` (`"nearest-median"` = the real member with the smallest L2
distance to the pointwise median / `"median"` = the synthetic pointwise-median path, `member: null`,
flagged / a pinned member index), `endpoints` (ghost endpoint dots). Unequal-length members each draw
to their own length on a shared index x-scale (never truncated); NaN members excluded (dev-warned);
single member → memberCount 1 (docs → Sparkline). Real accessible name: **"8 simulated paths end
between 28 and 61; typical path ends near 46."** (spread = endpoint range across ALL members; typical
= the emphasised path's endpoint).

**The interactive entry is THE HOP LOOP — the one place animation adds measured value (plan/16 Q4).**
On hover/focus it cycles members one at a time at ~400 ms/frame (≈ 2.5 Hz, the studied HOP cadence)
via a `setInterval` that swaps the surfaced accent path, looping until the pointer leaves.
**Reduced-motion: no loop** — ←/→ step members discretely (the same information without motion), read
off `matchMedia('(prefers-reduced-motion: reduce)')`. The live region announces **only** on a keyboard
step or when the loop stops — NEVER per frame — via a `announce` state decoupled from the per-frame
`active` state (so a screen reader isn't spammed at 2.5 Hz). Honesty enforced: a static frame is NOT
a HOP; no static copy claims the HOP findings; the loop is reduced-motion-gated with the stated
non-animated equivalent.

**Deviations logged:** (1) the HOP frames are `setState` swaps, not the spec's "WAAPI opacity on
pre-rendered paths (no re-render per frame)" — at ≤12 paths / 2.5 Hz a re-render is negligible and the
`useMemo`'d geometry means no recompute per frame; the WAAPI micro-opt wasn't worth the ref-juggling
complexity. (2) No `.mc-spark-readout` chip — the cycling full-accent path IS the visible feedback
(the HOP), and a per-frame number chip would fight the calm 2.5 Hz cadence and contradict the
"announce not per frame" rule; the visible-feedback DoD is met by the emphasised path. Both noted for
gate sign-off. Median computed inline (no `quantile` import) per the ShiftHistogram budget lesson;
scales + line builder inlined (like ChangePoint) — static a lean 2.28 kB (spec ≤ 2, but see: it's
UNDER even the tight spec target once — actually 2.28 > 2 spec, < 3 cap; interactive 3.13 < 3.5).

Gates: node 1417, browser 108, craft 361/0, size 2.28/3.13 (budgets 2.5/3.5, caps 3/4), bench 15.1
rows/ms (floor 12), docs 210 pages + tests 120, real-browser sweep green (all 13 ensemble SVGs 0
escapes; ghost bundle + accent emphasis; endpoints dots; synthetic-median variant; 12-ghost cap; live
hero == mdx string; interactive ←/→ member announce correct). New `EN_ENSEMBLE` module (`ensemble`,
`ensembleSingle`, `ensembleAt`).

### ⛳ BATCH 2 (decision micrographs, 21 types) COMPLETE — needs the batch gate

All 21 decision charts are shipped (W1: CoverageStrip, BenchmarkStrip, PercentileLadder, GradedBand,
IconArray; W2: RateVolume, NetFlow, RetentionCurve, BurnChart, ErrorBudget, ControlStrip,
ForecastCone, QuantileDots; W3: ABStrips, ShiftHistogram, ParetoStrip, DataDiff, QuadrantDot,
CyclePlot, ChangePoint, EnsembleGhosts). **Open items for the user's batch-gate sign-off** (per
plan/23 gate = "DoD ×21 + research-claim audit entries + craft bar"): the accumulated spec-vs-measured
BUDGET divergences (most static charts landed above their spec §-target but under the 3/4 kB HARD
caps — RateVolume 2.55, NetFlow 2.61, Retention 2.64, Burn 2.82, ForecastCone 2.83, QuadrantDot 2.17,
CyclePlot 2.44, EnsembleGhosts 2.28; **ChangePoint 2.93/3.93 sits AT the caps**), the BenchmarkStrip
citation gap (W1), and the two EnsembleGhosts interactive deviations (setState-not-WAAPI HOP; no
readout chip by design). None violate a non-negotiable; all are logged above. **Do NOT start Batch 3
(expressive, plan/24) before this gate is signed off.** **16 of 16 W2/W3 · 21 of 21 batch.**

## Batch 2 post-completion review — docs nav + dark-mode (2026-07-09)

User review of the shipped Batch 2 surfaced two real issues, both fixed:

1. **5 charts missing from the docs sidebar.** `apps/docs/content/docs/charts/meta.json` `pages[]` is a MANUAL ordered nav list — it stopped at `pareto-strip`, so data-diff/quadrant-dot/cycle-plot/change-point/ensemble-ghosts existed + were URL-reachable but invisible in nav. (The gallery / catalog.json / llms surfaces are registry-driven and already had them.) Added the 5 slugs.
2. **Line-based ghosts rendered invisible (worst on dark).** The `data-mc-ink="ghost"` CSS role is a FILL role (`fill:neutral; stroke:none`); on a stroked `<line>`/`<path>` its `stroke:none` (CSS beats the inline `stroke=` attr) killed the stroke and `fill:neutral` filled the open polyline into a faint wedge — EnsembleGhosts member paths, CyclePlot slot lines, ChangePoint regime-mean hairlines all near-invisible, gone on the dark surface. Fixed by ELEMENT-SPLITTING the `ghost` role (rect/circle/ellipse/polygon → fill; path/line/polyline → `stroke:neutral; stroke-opacity:.5; fill:none`) + a matching forced-colors split. Also floored two ultra-faint decorative tints for dark parity: QuadrantDot region .05→.08, ChangePoint regime shading .03/.06→.05/.11 (still subtle on light). Verified both themes in a real browser across the gallery + each new chart. Neither the SSR craft gate nor the getBBox sweep catches an invisible-stroke mark — only eyeballing light AND dark does; added to the review checklist (memory `chart-legibility-and-review-practices`). Gates re-run green: node 1417, browser 108, craft 361/0, size pass, docs 210 pages.

## Batch 2 post-completion review, round 2 — visual polish (2026-07-09)

Per-chart dark-mode pass (measured every decision-chart mark's composited luminance-delta vs the dark bg). Improvements:
- **ABStrips** — the chart's thesis ("does B beat A by more than the *overlap*") was not drawn; you inferred it from two parallel strips. Added (1) a shaded **contested-zone** rect = the x-overlap of the two p25–75 middle halves (narrow sliver = clear win, wide = inconclusive; skipped when they separate), and (2) a dashed **median-shift connector** from A's median to B's median (size + direction of the shift at a glance). Bumped the strip band opacities for dark (outer .16→.26/.20, inner .34→.42/.38). Budget 2.79/3.70 (was over the .7/.6 spec budget — bumped to 2.85/3.8, still < 3/4 hard caps).
- **QuadrantDot** — peer ghost dots were .18 (the ghost fill role is tuned for large-area marks, invisible as tiny dots on dark) → .42 + larger radius; focal gained a soft accent **glow disc** (a FILLED disc, not a hollow ring — craft caught the cross line showing as a chord through a ring) so it reads unmistakably against the peer cloud.
- **ChangePoint** — regime shading was two faint alphas (.05/.11); the .05 washed out on dark. Reworked to shade only the ODD regimes at a single visible .10 so adjacent regimes always contrast (bare vs tinted) in both themes.

**Audit-tool caveat:** the composited-luminance audit is BLIND to `oklab()`/`color-mix` colors (it can't parse them to RGB), so it false-positived ControlStrip's `--mc-band` (an `oklab(0.925 …/0.12)` near-white fill that is genuinely visible on dark — confirmed by screenshot). A speculative `--mc-band` 8%→12% bump was made then REVERTED once the false positive was understood; ControlStrip's band was always fine. Ground truth for dark visibility = real-browser screenshots, not the numeric audit. All gates green: node 1417, browser 108, craft 361/0, size pass, docs 210.

## Batch 3 (expressive, 22 types) — started 2026-07-09 (branch `batch-3-expressive`)

Branched off `batch-2-decision-w3` (the complete local Batch-2 tip; PR #5 merged into
`batch-2-decision`, PR #4 → main still open). Batch-2 gate items above remain open for the
user; the user authorized moving to Batch 3.

### TallyMarks (1) — `tally-marks` — deviations from plan/24 §1

1. **Variant prop `style` → `pen`.** plan/24 named the ruled/drawn variant `style="ruled"|"drawn"`,
   but all 54 existing charts expose `style?: CSSProperties` (the React style passthrough to the
   root `<Chart>`). Two `style` props can't coexist, so the variant ships as `pen?: "ruled"|"drawn"`
   — evocative (ruled = ruler-drawn, drawn = hand-drawn) and non-colliding. **Several later Batch-3
   charts also use `style` as a variant name in the spec (TreeRings `style="fill"`, SpiralYear, …);
   each will get a per-chart non-colliding name and be logged here.** No shared `variant` rename was
   forced (each chart's variant is a distinct semantic).
2. **Dropped `format`/`locale` props + `makeFormatter`.** plan/24 §1 lists no `format` prop; I had
   added one gratuitously. The count is always a non-negative integer, so the summary formats it with
   `String(count)` — SSR-deterministic (a locale formatter risks a server/client hydration mismatch
   on the accessible name) and it drops the whole `core/format` dependency from the static entry.
3. **Inlined mulberry32 (not `core/jitter`) for the `drawn` pen.** The seed is just the integer
   count, so a 6-line local `seededFrom(count+1)` replaces `import { seeded }` — this kept the static
   entry at 1.47 kB, under the Delta-class 1.5 kB HARD cap (importing `core/jitter` pushed it to
   1.56 kB). Same "inline lightly-used kernel helpers" pattern as ChangePoint. Determinism preserved
   and property-tested.

Budgets: static 1.47 / interactive 1.95 kB (caps 1.5 / 2.5). Node 1432, browser 3 (tally),
craft 373/0, bench 146 rows/ms, docs build + tests 122, tsc/oxlint/oxfmt/knip clean. Real-browser
sweep verified LIGHT (`--mc-stroke` #171717) and DARK (#ededed on a dark surface): tally clusters +
`+N` numeral crisp, 0 escapes, both themes. Node budget 2 (merged stroke path + numeral) held.

### DicePips (2) — `dice-pips` — plan/24 §2

No API deviations. Pip layout = canonical dice only (module constant `PIP_LAYOUT`);
`value > 6` renders the exact numeral in the face (the spec'd honesty fallback — no invented
7/8/9 pattern), `0` is an empty face (zero ≠ missing), negatives/NaN are invalid (→ noData).
Face outline uses `data-mc-ink="muted"` (neutral hairline, theme-tuned + forced-colors-mapped);
pips + numeral use `data-mc-ink="point"` (`--mc-stroke`). Budgets 1.29/1.7 kB (caps 1.5/2.5).
Real-browser sweep confirmed both themes (pips #171717 light / #ededed dark; face #8a8a8a / #9a9a9a).
Node 1447, browser 2 (dice), craft 385/0, bench 74 rows/ms, docs 216pp + tests 124.

### FillWord (3) — `fill-word` — plan/24 §3 + risk #4 RESOLVED

**Risk #4 (clip-path on SVG `<text>`) resolved:** the one-time spike passed. A CSS
`clip-path: inset(...)` set inline on an accent `<text>` copy (avoiding a `<clipPath>` element
and thus any generated id) reliably clips the glyphs to the value fraction in the real browser —
fill mode grows the accent from the left (`inset(0 {100(1−v)}% 0 0)`), drain empties from the left
(`inset(0 0 0 {100v}%)`). `textLength` + `lengthAdjust="spacingAndGlyphs"` pin the glyph extent so
the 0.62 em/char estimate is exact server-side and containment is provable without measurement.
No fallback re-spec was needed. (Cross-engine confirmation rides the Argos visual matrix.)

Base word = `data-mc-ink="label"` (neutral, theme-tuned + forced-colors-mapped); accent copy =
`data-mc-ink="accent"` (`--mc-accent`). One motion-layer CSS rule transitions the accent clip-path;
the accent copy lives inside `.mc-root`, so the existing `@media(prefers-reduced-motion)` `.mc-root *`
block already disables it — no per-wrapper reduced-motion rule needed. Dropped `format`/`makeFormatter`
(percent is `Math.round(v*100)`, SSR-deterministic). Variant `label` kept as spec (no `style`
collision here). Craft gate: added an ALLOWED exception for the intentional same-word base+accent
overlap (the audit's TEXT-TEXT check can't know the stack is the encoding). Budgets 1.38/1.75 kB
(caps 1.5/2.5). Real-browser sweep verified LIGHT + DARK two-tone (accent #0072b2 / base #8a8a8a),
0 escapes. Node 1461, browser 2, craft 397/0, bench 103 rows/ms, docs 219pp + tests 126.

### FatDigits (4) — `fat-digits` — plan/24 §4 + FatFonts deviation (risk #1)

**FatFonts adaptation (recorded deviation, was plan/24 risk #1):** the FatFonts research encodes
magnitude as glyph ink AREA via a custom font. Shipping a font would break zero-dep (non-negotiable
#1), so FatDigits maps magnitude to discrete `font-weight` tiers (5: 300/450/600/750/900; 3:
400/550/750) on the INHERITED font instead. Weight is ordinal (never claimed continuous); the
numeral is always the exact value. On a non-variable host font the browser snaps to the nearest
available weight (~2 effective tiers) — documented graceful degradation, numeral unaffected. True
ink-area digits remain future `@microcharts/outline` territory. Real-browser sweep confirmed the
weight tiers render visibly distinct (system-ui supports 300–900) in both themes.

`encode="value"` weights the whole numeral (one `<tspan>`); `encode="digit"` weights each digit by
its own magnitude (⌈(d+1)/(10/tiers)⌉). No `domain` → the middle tier (docs steer to always pass
one). Uses `makeFormatter` (needed for grouped numerals + the tier summary) → static 1.6 kB, above
the spec's 1.5 kB Delta-class target but under the 3 kB hard cap — logged for the batch gate (same
class as the Batch-2 budget divergences). Variant names kept as spec (`encode`/`tiers`, no `style`
collision). One motion-layer CSS rule transitions weight; tspans inside `.mc-root` → reduced-motion
block gates it. Node 1477, browser 2, craft 409/0, bench 127 rows/ms, docs 222pp + tests 128.
