# 16 — Decision Micrographs (20 types)

> Status: draft v1 · The third catalog: charts named for the **real-world question they answer**, grounded in decision-science research (verified 2026-07-06, citations below). The most underserved territory in dataviz is not prettier trends — it's honest **uncertainty, comparison, and trust** at inline scale. No mainstream library ships any of these as first-class micro components.
> Ships in core (`@microcharts/react`) — these are workhorses, not expressive flourishes. Same grammar, tokens, a11y summaries, budgets.
> Visual reference: [chart-gallery.html](chart-gallery.html), "Decision micrographs" section.

## "Where is this going?" — forecasting & uncertainty (4)

| # | Type | Question | Research grounding |
|---|---|---|---|
| Q1 | **ForecastCone** | Will we land? | Bank of England fan chart (since 1996). Micro rules: 2–3 bands max (50/80%); the *widening itself* is the message — a cone that doesn't widen misrepresents confidence decay |
| Q2 | **QuantileDots** | What are the odds? | Kay et al. CHI 2016 "When (ish) is My Bus?", Fernandes et al. CHI 2018: 50-dot quantile dotplots reached **97% of optimal expected payoff**, beating CI bars and text. Micro: 15–20 dots (countable in clusters); count-the-dots-past-the-line turns probability into frequency — the format lay people actually reason with |
| Q3 | **GradedBand** | How sure are we? | Correll & Gleicher TVCG 2014 "Error Bars Considered Harmful": bar+CI causes *within-the-bar bias*; opacity-graded bands don't, and calibrate viewer confidence better. Nested 50/80/95 opacities, never a false hard edge |
| Q4 | **EnsembleGhosts** | What could happen? | Static cousin of Hypothetical Outcome Plots (Hullman et al. PLOS 2015: +35–41 pts accuracy). Research verdict honored: a static frame ≠ a HOP — we show a *few faint simulated paths + one emphasized*, and the interactive entry can loop true HOP frames on hover |

## "Is this normal? Did it work?" — judgment & comparison (5)

| # | Type | Question | Notes |
|---|---|---|---|
| Q5 | **BenchmarkStrip** | Is this value normal? | Peer range as quiet band (empirical p25–75 + p5–95), your value as the dot, percentile stated. The simplest high-value uncertainty micro form: band + dot, no axis |
| Q6 | **ABStrips** | Did B beat A? | Two quantile strips on one scale — the overlap is the honest answer, not a bare average delta |
| Q7 | **ShiftHistogram** | Did the fix change things? | Mirrored before/after distributions; the shift is the proof |
| Q8 | **ChangePoint** | When did behavior change? | Sparkline + detected-regime shading + break marker — context for every anomaly |
| Q9 | **ControlStrip** | Is the process in control? | Shewhart control chart (±3σ / empirical percentile band for skewed data) at cell size; out-of-band points flagged. Western Electric secondary rules documented for the real component |

## "Are we on track?" — commitments & budgets (4)

| # | Type | Question | Notes |
|---|---|---|---|
| Q10 | **ErrorBudget** | Are we burning too fast? | Google SRE Workbook burn-rate conventions: budget-remaining line vs steady-burn diagonal; real component encodes the standard 1×/6×/14.4× burn-rate alert bands |
| Q11 | **BurnChart** | Will we finish? | Plan dashed, actual solid, today marked, projection dotted to deadline — the burn-down/up generalized |
| Q12 | **RetentionCurve** | Do they stay? | Product-analytics convention (Amplitude/Mixpanel): decay-to-plateau shape + benchmark ghost behind; "does it plateau" reads at 30 px |
| Q13 | **CoverageStrip** | Can I trust this data? | Measurement presence vs gaps — missingness made visible *before* conclusions. Data-trust as a first-class chart is essentially unshipped anywhere |

## "What's really going on?" — structure & trust (5)

| # | Type | Question | Notes |
|---|---|---|---|
| Q14 | **NetFlow** | In vs out? | Mirrored areas around zero + net line on top — cash flow in a table cell |
| Q15 | **PercentileLadder** | What's the tail? | p50/p90/p99 ticks on one strip — the median never tells the latency story alone |
| Q16 | **RateVolume** | Rate moved — on what volume? | Ghost bars carry the denominator so a 100% jump on 3 events can't lie. Lie-factor guardrail as a chart type |
| Q17 | **DataDiff** | What changed between versions? | Added right / removed left per key — the code diff, generalized to data |
| Q18 | **QuadrantDot** | Where does this sit? | Effort × impact position against the field — the 2×2 at glyph size |

## "What repeats, and what matters first?" — pattern & priority (2)

| # | Type | Question | Notes |
|---|---|---|---|
| Q19 | **CyclePlot** | What repeats beneath the trend? | Seasonal-subseries plot compressed to one period: each slot shows its within-slot trajectory while the connected slot means reveal the cycle. Micro rule: 4–12 known periods, one mean spine, local trends never smoothed across period boundaries |
| Q20 | **ParetoStrip** | What should we fix first? | Descending impact bars + cumulative-share line on a fixed 0–100% scale. The threshold is explicit and configurable—80% is a reference, never a claimed law—and “Other” stays last rather than corrupting the rank order |

## Research-derived system rules (adopted library-wide)

1. **Glanceability is measured, not vibes**: Blascheck et al. (PacificVis 2023 / CHI 2024) — bars read < 300 ms, donuts < 220 ms, radial bars up to 1,780 ms at watch scale. Hard numbers behind our gauge/radial rejection; donut-at-tiny-size rehabilitated for *single-proportion* reads only.
2. **Designed degradation order** (arXiv 2404.01485, multiscale design space): every chart spec defines what drops first as space shrinks — axis → gridlines → labels → marks. Wired into the container-query adaptivity story (doc 03/06): shrinking a microchart follows a *designed* order, never ad-hoc clipping.
3. **Frequency beats probability** for lay decisions (quantile-dots lineage): wherever we display chance, prefer countable units over % where space allows.
4. **Uncertainty display is honesty, not decoration**: value-suppressing palettes (Correll/Moritz/Heer CHI 2018) inform HeatCell's optional uncertainty mode — display precision degrades as data precision does.
5. **Sketchy-line rendering** (2025 uncertainty-viz survey) noted as a future theme-level uncertainty encoding (`uncertain` stroke style) — pre-attentive "this is approximate" without a legend. Backlogged, not v1.x.
6. **Seasonality and priority earn dedicated forms**: CyclePlot separates within-period change from the recurring seasonal profile; ParetoStrip ranks causes while keeping cumulative impact on an explicit 0–100% scale. PolarClock/SpiralYear remain compact calendar fingerprints, not substitutes for these decision tasks.

## Citations

Kay et al., CHI 2016 (10.1145/2858036.2858558) · Fernandes et al., CHI 2018 (idl.uw.edu/papers/uncertainty-bus) · Correll & Gleicher, IEEE TVCG 2014 · Correll, Moritz, Heer, CHI 2018 (VSUPs) · Hullman et al., PLOS ONE 2015 + IEEE VIS 2018 (HOPs) · BoE fan chart / BIS ifc_8thconf_62 · Google SRE Workbook, "Alerting on SLOs" · Shewhart individuals control chart · Blascheck et al. glanceable-vis studies (CHI 2024) · xeno.graphics (Lambrechts) · arXiv 2404.01485 (multiscale design space) · Amplitude/Mixpanel retention conventions · NIST/SEMATECH seasonal-subseries plot guidance (Cleveland 1993 lineage) · American Society for Quality Pareto-chart procedure.

**Catalog contribution: 20 decision types** (full catalog: 96 across docs 05/16/15/17).
