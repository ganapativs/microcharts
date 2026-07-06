# 05 — Chart Catalog

> Status: v2 (final-pass expanded) · Inputs: taxonomy research (Tufte/Few sources, Datadog/Stripe/MUI/GitHub evidence)
> Defines: the v1 five, the 34-type core catalog (96 total with docs `16`/`15`/`17`), and the four common-path data shapes that keep everyday APIs small.
> Visual reference: **[chart-gallery.html](chart-gallery.html)** — every type rendered in the design language.

## 1. The data-shape model

Every core workhorse is a view over one of **four common-path data shapes**. These keep everyday APIs learnable and cover the v1 proving set plus the 34-type core catalog. Advanced collections may introduce an explicit structured record only when that structure *is* the unique story—paired trajectories, event lanes, nested spans, or hierarchies—while still sharing the same prop grammar (see `04-api-design.md`). Pretending StationGlyph, TokenConfidence, or TraceFold are one of four arrays would make the types less honest, not simpler.

| Shape | TypeScript sketch | Charts built on it |
|---|---|---|
| **S1 Ordered series** | `number[]` or `{x?, y}[]` | Sparkline (line/area/step/smooth), band sparkline, bar sparkline, win-loss, seismogram/barcode, heat strip, histogram strip, strip/rug |
| **S2 Categorical set** | `{label, value}[]` | Mini bar, dot plot (incl. stem variant), paired bars, slope (2-point), mini box (from 5-number summary) |
| **S3 Part-to-whole** | `{label, value}[]` (sums to whole) | Progress bar, segmented bar, progress ring, micro donut (capped wedges + "Other" rollup) |
| **S4 Scalar + reference** | `{value, target?, range?, prev?}` | Delta indicator, bullet, heat cell, status dot, trend arrow |

## 2. v1 — the proving five (+1 free variant)

Chosen by usage evidence (Stripe metric cards, Datadog widgets, MUI X sparkline, GitHub activity graph) and by how much of the taxonomy each subsumes:

| # | Component | Shape | Why first | Key variants (props, not new components) |
|---|---|---|---|---|
| 1 | **`<Sparkline>`** | S1 | The load-bearing default; every dashboard leads with it | `curve: "linear" \| "smooth" \| "step"`, `fill` (area variant), endpoint/min/max dots, normal-range band |
| 1b | **Band variant** | S1 | Nearly free once Sparkline exists; the most Tufte-canonical form (Beautiful Evidence) | `band={[lo[], hi[]]}` low-opacity range behind line |
| 2 | **`<SparkBar>`** | S1 | Same grammar, `bar` geometry; subsumes win-loss (`mode="winloss"`) | win-loss, baseline at zero, positive/negative coloring |
| 3 | **`<Delta>`** | S4 | Single most common element in SaaS KPI cards (arrow + %, optional ghost sparkline) | direction glyph always paired with color (a11y), `format`, invert-polarity (down = good) |
| 4 | **`<Bullet>`** | S4 | Few's gauge replacement — ships *instead of* a gauge, marketed as such | measure + target tick + qualitative bands |
| 5 | **`<ActivityGrid>`** | S1 (binned) | GitHub contribution strip — most-copied dataviz UI of the decade; proves color-encodes-variable | strip (1×N) and grid (7×N) layouts, discrete color steps |

v1 proves: shared grammar across all four data shapes (S1×2, S4×2, plus band), SSR-static rendering, animation system, theming system, a11y system — on real, high-demand components.

## 3. Full catalog — 34 core chart types (v1 five → v2/v3 buildout)

Distinct chart *types* (not prop variants), all micro-viable. Roadmap bakes all 34 in (+20 decision in `16`, +22 expressive in `15`, +20 frontier in `17` → **96 total**); the architecture (shared geometry/math core, one prop grammar, specialized data records only when earned) is what makes a hundred-type future possible without becoming a junk drawer.

### Trend — ordered series (S1) — 13 types
| # | Component | Min footprint | What it uniquely shows |
|---|---|---|---|
| 1 | Sparkline (line/area/smooth/step) | 60×16 | the trend · **v1** |
| 2 | Band sparkline | 60×20 | trend vs normal range · **v1b** |
| 3 | SparkBar | 60×12 | discrete periods · **v1** |
| 4 | Win-loss | 60×12 | binary outcomes streak |
| 5 | **Horizon chart** | 80×14 | large value range in tiny height via folded layered bands — *the* canonical micro-density technique; flagship v2 addition |
| 6 | **OHLC / candle spark** | 80×16 | open-high-low-close per period; financial table rows |
| 7 | **Dual sparkline** | 60×16 | series vs benchmark overlay (2 series max, dash-differentiated) |
| 8 | **Stacked-area micro** | 60×16 | share-shift over time, ≤ 3 series, zero-anchored |
| 9 | **Bump strip** | 60×16 | rank position over time for one entity (#3→#1) |
| 10 | Seismogram / barcode | 60×16 | event density/intensity ticks |
| 11 | Histogram strip | 60×16 | distribution, ≤ 12 bins |
| 12 | Rug strip | 60×10 | raw observation ticks; composable under Sparkline |
| 13 | Heat strip | 10×10/cell | value-by-time as color cells (1×N ActivityGrid) |

### Categorical — labeled values (S2) — 7 types
| # | Component | Min footprint | What it uniquely shows |
|---|---|---|---|
| 14 | MiniBar | 50×16 | magnitude ranking in a cell |
| 15 | DotPlot | 50×16 | few-value comparison, minimal ink (`stem` prop variant absorbs the former Lollipop — the stem never was a separate data story) |
| 16 | PairedBars | 60×20 | budget-vs-actual pairs |
| 17 | Slope (2-point) | 40×40 | before/after across categories |
| 18 | MicroBox | 40×14 | 5-number summary (p50/p95/p99 rows) |
| 19 | **Dumbbell / range bar** | 60×12 | min→max or from→to per row (salary bands, confidence spans) |
| 20 | **Waterfall micro** | 70×18 | how deltas compose into a total (P&L in a cell) |

### Part-to-whole (S3) — 6 types
| # | Component | Min footprint | What it uniquely shows |
|---|---|---|---|
| 21 | Progress (linear) | 40×8 | completion + direct % label |
| 22 | SegmentedBar | 60×10 | composition, ≤ 5 segments, direct labels |
| 23 | ProgressRing | 24×24 | icon-level completion affordance |
| 24 | MicroDonut | 24×24 | capped wedges + "Other" rollup; `decorative` subpath |
| 25 | **Funnel micro** | 60×18 | stage-to-stage conversion in a cell |
| 26 | **Pictogram row** | 60×12 | unit counts ●●●○○ (5-of-8 seats, ratings) |

### Scalar + reference (S4) — 5 types
| # | Component | Min footprint | What it uniquely shows |
|---|---|---|---|
| 27 | Delta | 50×14 | change vs prior · **v1** |
| 28 | Bullet | 80×16 | value vs target vs qualitative bands · **v1** |
| 29 | HeatCell | 12×12 | one value as calibrated color (grid context) |
| 30 | StatusDot | 8×8 | categorical state (never color-alone) |
| 31 | TrendArrow | 16×16 | direction glyph, minimal form of Delta |

### Matrix / time-structured — 3 types
| # | Component | Min footprint | What it uniquely shows |
|---|---|---|---|
| 32 | ActivityGrid | 7×N cells | intensity calendar (GitHub-style) · **v1** |
| 33 | **Calendar strip** | 7×7/wk | week-shaped recent activity |
| 34 | **Event timeline / span strip** | 80×12 | durations + events on a row (mini-gantt: uptime windows, on-call shifts, release spans) |

### Composite helpers (not counted as types)
`<SparkGroup>` shared-scale provider (small multiples, kills the per-row auto-scaling bug) · annotation layer (`<Threshold>`, `<Marker>`, `<TargetZone>`, `<Callout>`, and `<Marker celebrate>` — the relocated confetti moment: particle burst on milestone crossing, earned only) working identically inside every S1/S2 chart. Stacked-area micro takes a `style="ridge"` variant (the relocated MountainRidges look).

**Beyond 96**: the grammar + core scale to hundreds of types (community + demand-driven: recurrence plot, micro radar, ridge strip, compass…). Bar for admission stays fixed: earns its keep at ≤ 200×60 px, unique data story, passes the design principles. A public "chart proposals" template channels demand.

## 4. Not shipping (summary)

Pie, gauge/speedometer, battery, waffle, violin, full calendar grids — each fails micro scale or the data-ink bar; strictly-better replacements exist in-catalog (bullet ← gauge, segmented bar ← pie, micro-box ← violin). One line in the FAQ, no public manifesto — the catalog argues by existing.

## 5. Tufte implementation checklist (applies to every component)

- Height defaults to `1em`-ish (line-height of host text); never taller than the text gap it sits in.
- Sparkline aspect: ship `bankTo45()` util — width suggested from data variance (Cleveland banking), manual override always wins.
- No axes, gridlines, tick labels, or legends. All labeling is direct (endpoint value, min/max dots).
- Endpoint dot + adjacent value label; min/max dots visually distinct.
- Normal-range band = real data (percentile/target band), never decoration; rendered lowest z-order.
- Range-frames where a frame exists at all: axis line spans data min→max only.
- Areas anchor at zero (lie factor = 1). Line sparklines may use data-min baseline (Tufte's own practice) — document the difference.
- Color encodes a variable or state; never decorates. Hard-code away 3-D, bevels, shadows, moiré — not theme options.
- Small multiples share one scale + one physical size via `SparkGroup`.
- Erase before adding: default no fill under lines; fill is opt-in where legibility demands.
