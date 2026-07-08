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
