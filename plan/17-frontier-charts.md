# 17 — The Frontier Collection (21 types)

> **EXPANDED 2026-07-08:** +F21 ConfusionGrid (AI-era section; research-validated — see plan/12 catalog-expansion entry). Full catalog now 100 (plan/21).

> Status: draft v2 · Fourth catalog, from dedicated cross-domain research cycles (2026-07-06). The thesis: **entire professions standardized brilliant micro data displays that chart libraries rarely absorb** — aviation, medicine, meteorology, audio, trading, AI tooling, observability, dynamical systems. These would surprise expert chart-UX designers because they come from outside the usual web-chart canon.
> Admission bar unchanged: honest documented channel, read-back without training (or with a 1-line key), ≤ 200×60 px, unique data story. Ships across core/v2 per roadmap note below.
> Visual reference: [chart-gallery.html](chart-gallery.html), "Frontier collection" section.

## From professional instrument panels (5)

| # | Type | Lineage | What it uniquely does |
|---|---|---|---|
| F1 | **TapeGauge** | Aviation PFD speed/altitude tapes (NASA-studied) | **Inverts the sparkline**: the current value is fixed at a pointer, the scale scrolls past it. Value + rate + zone bands in ~1 character of width. The trend chevron shows rate-of-change separately from level |
| F2 | **StationGlyph** | WMO station model, standardized since 1941 | 6+ variables in one character-sized glyph via **fixed geometric slots** (center fill = fraction, stick angle = direction, quantized barbs = magnitude, corner slots = auxiliary values). We generalize the slot grammar to arbitrary metrics — the strongest "surprise an expert" find of the entire project |
| F3 | **WindBarb / Streamlet** | WMO wind barbs + streamlet glyph studies | Direction + **quantized** magnitude (half/full/pennant flags) in one mark — for any direction+magnitude pair: traffic flow, net migration, request routing |
| F4 | **DualWindowMeter** | Broadcast loudness metering (ITU-R BS.1770 / EBU LUFS) | Two integration windows co-plotted — fast/momentary thin, slow/integrated thick — against a target line. The general form of "noisy metric with a compliance target" (latency SLO, CPU headroom). Ballistics (damping) exposed as a documented parameter |
| F5 | **DepthWedge** | Trading orderbook depth charts | Two cumulative step-wedges meeting at the spread — supply vs demand posture in a glyph. Documented honesty rule: axis scale choice stated, never silently log |

## From medicine & the quantified self (3)

| # | Type | Lineage | What it uniquely does |
|---|---|---|---|
| F6 | **TimeInRange** | AGP consensus standard (Johnson et al. 2019, *Diabetes Care*) — a literal committee-ratified microchart | Time-in-band stacked strip with fixed semantic zone order (below/in/above range) + % labels. Directly portable to SLOs, uptime, thermal/budget corridors |
| F7 | **FoldedDayBand** | AGP modal-day profile | **Folds 14 days onto one 24-hour axis**: median line + 25–75 and 5–95 percentile envelopes. "What does a typical day look like, and how typical is today?" — periodic aggregation no mainstream library ships |
| F8 | **Hypnogram** | Sleep medicine → every wearable (CHI 2022 evaluated) | Categorical **step strip that refuses interpolation** — sleep stages, deploy states, incident severities, machine states. Forces the correct discrete-state honesty rule that line charts violate by default |

## From media & developer tools (3)

| # | Type | Lineage | What it uniquely does |
|---|---|---|---|
| F9 | **Waveform** | Audio envelope displays (SoundCloud/voice memos) — arguably the most-seen microchart on earth | Mirrored amplitude strip with the **max-per-bucket downsampling rule** (never mean — means hide spikes). The rule generalizes to any high-frequency metric compressed to sparkline width. Documented pitfall: peak-normalize honestly, never rescale quiet data to look loud |
| F10 | **MinimapStrip** | VS Code minimap / game minimaps | Content-thumbnail + **viewport window** + annotation-tick lane in one strip: position-in-the-whole for long documents, timelines, logs. Fog-of-war convention adopted for unknown regions (absence ≠ zero) |
| F11 | **StarSpoke** | Star-glyph research (validated: contour-free wins for outlier/similarity tasks; Chernoff faces confirmed dead) | 4–6 spokes, length = value, no contour polygon — the honest dense multi-variable glyph for comparing entity profiles at a glance |

## From the AI era (4 — F21 added 2026-07-08)

| # | Type | Lineage | What it uniquely does |
|---|---|---|---|
| F21 | **ConfusionGrid** (ADDED 2026-07-08) | Confusion-matrix heatmaps — the standard classifier-evaluation display; generalized by Neo (Apple, CHI 2022, arXiv 2110.12536) and ConfusionFlow (TVCG, arXiv 1910.00969) | A k×k labeled agreement matrix at glyph scale (2×2 default, ≤ 4×4): rows = actual, columns = predicted, cell ink = count share, **diagonal = agreement, accented**; off-diagonal cells show exactly *where the errors go* — the one thing accuracy-as-a-number hides. Generalizes beyond ML to any paired-classification agreement (triage vs outcome, plan vs actual category, A-rater vs B-rater). Sibling of CalibrationStrip (trust the probability) and RubricStrip (don't collapse quality): ConfusionGrid = don't collapse *errors*. Micro rules: counts normalized per-row by default (documented), raw-count mode available, k > 4 refused (legibility bar), never color-alone (diagonal gets a shape accent) |
| F12 | **TokenConfidence** | LLM logprob UIs (OpenAI cookbook lineage; discrete-tier finding from 2026 preprint, cited cautiously) | Per-token confidence as a **typographic property** — tinted underlines beneath the text itself. Design rule adopted: discrete tiers ("confident/unsure/guessing"), not a continuous gradient — people calibrate categorically. The text *is* the chart; extends our FillWord family and the AI-native spec (doc 14) |
| F13 | **RubricStrip** | Model-eval scorecards (LLM Comparator, CHI 2024; Anthropic eval practice) | Weighted multi-criteria mini-bars — bar height ∝ criterion weight, length = score. **Structurally resists collapsing quality into one dishonest number.** Evals, code review, vendor comparison |
| F14 | **EtaBar** | Streaming-progress gap identified in AI product UX | Progress bar that **re-forecasts honestly**: solid = observed, remainder sized by observed rate (not linear interpolation), ETA label updates as rate changes. The download bar, told truthfully |

## From trading floors (1)

| # | Type | Lineage | What it uniquely does |
|---|---|---|---|
| F15 | **VolumeProfile** | Bloomberg/TradingView volume-at-price | Histogram **perpendicular to the trend axis**: where activity concentrated, not when. Modal row (POC) accented, value area shaded. Structurally novel to chart-library grammars; generalizes to any level-of-activity distribution |

## From systems, traces & trustworthy models (5)

| # | Type | Lineage | What it uniquely does |
|---|---|---|---|
| F16 | **PhaseTrace** | Dynamical-systems phase portraits | Two synchronized signals become an x×y trajectory; path order carries time and the current state is a directed endpoint. Loops expose lag/feedback and clusters expose regimes that two separate sparklines hide. Medium precision; axes/domains must be named |
| F17 | **TraceFold** | OpenTelemetry span trees + browser flame charts | Start position = wall-clock time, width = duration, row = nesting depth. One request becomes a folded micro trace with the critical path accented—“where did the latency go?” without opening a full observability console |
| F18 | **EventRaster** | Neuroscience spike rasters | One lane per source/trial, one tick per event. Vertical bands reveal synchronization; diagonals reveal propagation; sparse rows reveal silence. Generalizes cleanly to service events, agent steps, jobs, and sensor triggers |
| F19 | **CalibrationStrip** | Reliability diagrams (DeGroot/Fienberg; Guo et al. 2017) | Predicted probability × observed frequency against the identity diagonal, with quiet support bars per bin. It answers whether a probability deserves trust while preventing tiny bins from looking authoritative |
| F20 | **PartitionStrip** | Icicle plots (Kruskal & Landwehr 1983) | Width = share of whole, rows = hierarchy depth, alignment = parentage. A two-level hierarchy remains legible in 24 px—bundle composition, storage, budgets—where a flat SegmentedBar discards structure and a treemap loses alignment |

## Absorbed as refinements (not new types)

- **Fading-edge uncertainty bands** (arXiv 2508.00937 taxonomy): GradedBand (Q3) and band sparkline docs adopt opacity-fade tails — hard-edged bands overclaim precision.
- **Micro-HOP animation** (NetHOPs lineage): becomes the *interactive* mode of EnsembleGhosts (Q4) — 5–8 resampled paths cycling ~2 Hz, static ghosts as the reduced-motion/SSR fallback.
- **CooldownSweep**: radial time-until-ready wipe = `sweep` mode on ProgressRing (12 o'clock, clockwise depletion convention; the "ready sparkle" layer explicitly rejected as decoration).
- **Win/Loss/Tie**: 3-state mode on Win-loss (LLM Comparator per-example indicator).

## System rules adopted (library-wide)

1. **Pattern as the second channel** (He et al., TVCG 2024/2026): monochrome texture/pattern fills as an evaluated, honest second variable — one implementation serving print, e-ink, *and* forced-colors. Geometric textures preserve quantitative reading; iconic aid categorical recall; ≥ 8px repeat unit.
2. **Sketchy stroke = uncertainty style** (Wood & Isenberg lineage confirmed): a theme-level `uncertain` stroke treatment — reads "approximate" pre-attentively, no legend.
3. **Icons dominate real-world word-scale usage** (CHI EA 2026: 80% icons vs 16% mini-charts in 126k papers): validates Delta/TrendArrow/StatusDot as first-class citizens, not lesser charts.
4. **Word-scale visualization research** (Goffin et al. 2014 → GistVis 2025) formally adopted as the library's academic grounding — placement grammar (inline/margin/overlay) informs the docs' 4-contexts pattern.

## Rejected this cycle (with reasons)

Chernoff/face glyphs (perceptually serial, confirmed dead by 2021+ research) · readiness rings as "research-backed" (branding convention, no perceptual validation — our ProgressRing already covers the honest core) · FUI radar sweeps/scan grids/data waterfalls (Territory Studio's own framing: credibility theater, no bound data) · EV power-flow particles (cosmetic loop speed) · EV range-confidence cones (patent-stage, not yet practice — revisit) · "uncertainty urchins"/"gestalt lines" (terms could not be verified to exist — not implemented on name alone).

## Citations

WMO station model · NASA NTRS 19870010832 (tape displays) · Johnson et al. 2019 *Diabetes Technol Ther* (AGP) · Islam et al. CHI 2022 (sleep vis) · ITU-R BS.1770/EBU R128 · Goffin et al. TVCG 2014 + GistVis arXiv:2502.03784 · Graphing Inline arXiv:2603.10533 · He et al. arXiv:2307.10089 + 2508.02639 · Petek et al. arXiv:2508.00937 · NetHOPs arXiv:2108.09870 · LLM Comparator arXiv:2402.10524 · Wood & Isenberg sketchy rendering · TradingView/amCharts depth+profile docs · Apple watchOS HIG complications · Game UI Database · OpenTelemetry Trace API/concepts · Brendan Gregg flame-graph/flame-chart lineage · Toups et al. 2011 event-structure rastergrams + Rastermap 2025 · Guo et al. ICML 2017 reliability diagrams · Kruskal & Landwehr 1983 icicle plots · phase-portrait literature · Neo: generalized confusion-matrix vis, Apple, CHI 2022 (arXiv:2110.12536) + ConfusionFlow (arXiv:1910.00969) (F21, verified 2026-07-08).

**Final catalog (amended 2026-07-08, plan/21): 36 core + 21 decision + 22 expressive + 21 frontier = 100 types** (originally 34 + 20 + 22 + 20 = 96).

Roadmap note: flagships = TapeGauge, TokenConfidence, TimeInRange, Waveform, Hypnogram, TraceFold, CalibrationStrip (highest usage-breadth). StationGlyph is the halo/marketing piece. Rest demand-driven in v2.x.
