# Visual craft audit — Batch 1 charts (living doc)

Round-13 full visual sweep of all 34 shipped charts. Method, findings, and the
standing gates that keep them fixed. **When a new visual bug is found, add a row
to the Findings table with issue / expectation / repro, and add a matrix config
to `tests/craft/matrix.mjs` that would have caught it.**

## Method (how this was audited — reproducible)

1. **Programmatic geometry+text audit** — `pnpm craft` (`tests/craft/matrix.mjs`)
   renders every chart × every label-bearing prop combination × several sizes
   (141 configs) against `dist/` and fails on:
   - text escaping the viewBox (`audit.mjs` ESCAPE),
   - text overlapping other text (TEXT-TEXT),
   - text sitting on a data mark (TEXT-ON-MARK; EventTimeline in-span labels and
     reference bands are by-design exemptions),
   - **a connector line crossing the interior of a hollow mark**
     (`geometry-audit.mjs` LINE-THROUGH-HOLLOW — added this round),
   - a filled mark escaping the viewBox (MARK-ESCAPE).
2. **Visual gallery scan** — a temporary `/audit-view` route rendered every
   chart's `showcase` + all `recipes` on light AND dark panels, scanned
   section-by-section (screenshots). Route was scaffolding; delete after use.
   To regenerate: a page that maps `MODULES` from `lib/charts/registry` and
   renders `<m.showcase.Node/>` + `m.recipes[].node` in `[data-mc-theme]` light
   and dark panels. Keep it OUT of the `(home)` route group (its scroll
   animation breaks screenshots) — put it at a top-level `app/<name>/page.tsx`.
3. **Coordinate spot-checks** — SVG text/mark coordinates dumped and measured for
   any chart that looked off in the thumbnail (baseline centering, gutter width).
4. **Interactive overlays** — the browser suite covers readout text / focus-ring
   presence / keyboard nav, but NOT pixel alignment. Pointer alignment was swept
   LIVE by measuring, for every pointer-mapping interactive entry, whether the
   inner SVG fills the focusable wrapper (`svg.rect == wrapper.rect`). Drift
   happens only when a demo sizes the wrapper by CSS width without the SVG
   filling it — enumerated the 6 CSS-width demos, measured the 2 pointer-mapping
   ones (calendar drifted, micro-donut clean), and spot-measured a grid
   (activity-grid), a nearest-x (ohlc), and a band (dumbbell) chart — all
   `svg == wrapper`. **Rule:** a fixed-cell/unit chart whose interactive demo
   scales via CSS width MUST pass `style={FILL}` to its composed static.

## Findings

| # | Chart | Severity | Issue | Expectation | Status |
|---|-------|----------|-------|-------------|--------|
| 1 | Dumbbell | HIGH | Connector ran dot-center → dot-center, so it crossed the interior of the hollow "before" ring (`fill="none"`, r 1.7) and showed through — the line visibly pierced the empty dot. Present at every size, static + interactive. | Connector stops at each dot's EDGE; the hollow ring reads as a clean circle with the line meeting its rim. | **FIXED** (`src/charts/dumbbell/index.tsx`): connector endpoints inset by the mark radius along the row; if the dots nearly touch, the connector is dropped. Regression test + geometry-audit gate added. |
| 2 | Slope (docs recipe) | LOW | `KPI before/after` recipe spread the right-side labels to the minimum glyph pitch — legible but cramped. | More breathing room. | **FIXED** — recipe now 140×96 (5 rows breathe). |
| 4 | 15 charts (labels) | HIGH | Direct labels centered vertically with `y = center + fontSize*0.35` (cap-box half) sat ~2.5 px HIGH — the browser and the eye center the full line-box, and a fixed constant cannot match it across fonts. `dominant-baseline="middle"` (ohlc/dual/sparkbar) was ~1.3 px high too. | Label box centered on its band/mark/ring. | **FIXED** — measured in-browser: `dominant-baseline="central"` + `y = center` centers exactly (deltaPx 0.00). Applied to likert, segmented, dot-plot, dumbbell, heat-cell, slope, bump-strip, progress, trend-arrow, progress-ring, ohlc, dual-sparkline, sparkbar, sparkline-last. Edge-anchored labels (funnel top, sparkline min/max, stacked-area stagger) left alphabetic. Browser regression test asserts deltaPx < 1.2. |
| 5 | Progress / Ohlc | LOW | Value label sat only 3 units from the bar / last candle — read as stuck to it. | More separation. | **FIXED** — label gutter gap `+3 → +5` in both. |
| 6 | Horizon | — | User asked whether impl/visuals are correct. | — | **VERIFIED** — a correct, property-tested horizon implementation (darker = farther from baseline; half-open fold bands). The slightly blobby look is inherent to the technique at low data density, not a bug. |
| 3 | CalendarStrip (interactive) | HIGH | Pointer drift: the interactive wrapper was sized 180 px by the demo, but the fixed-cell grid's SVG rendered at its intrinsic 55 px, left-aligned. Pointer math divides by the 180 px wrapper while cells live in the left 55 px → crosshair/focus landed far off the cursor. Only interactive charts sized by CSS width (not geometry props) are affected; CalendarStrip was the only one (fixed 7 px cells force CSS scaling). | The SVG fills the focusable wrapper so pointer math is exact. | **FIXED** — composed static now gets `style={FILL}` (`display:block; width:100%; height:auto`). Browser regression test asserts `svg.width == wrapper.width`. |

| 7 | Label breathing space | LOW | Label-to-mark gaps were inconsistent (likert 2, dumbbell 3.5, dot-plot/sparkline/dual 4, progress/ohlc 5) and the tightest read as cramped: likert 2px, bump `#1` 0.5, sparkline/dual last 2. | A comfortable, consistent gap. | **FIXED** — standardized beside-mark label gaps to ~4 units (likert 2→4, dumbbell 3.5→4, sparkline/dual last +4→+6, bump end labels +2→+5). Measured live: likert 2px→4px. dot-plot/slope (3) and progress/ohlc (5) left as-is. |

## Verified clean (checked, no issue)

- **DotPlot** — value labels are correctly glued to each dot (Ada "96" sits left
  of the far-right dot; Kim "41" right of the far-left dot); label column is
  right-aligned in a fixed left gutter; baselines centered on the dot rows. The
  thumbnail looked busy only because a dot plot legitimately scatters its dots.
- **LikertStrip** — end/net labels hug the bar ends (fixed a prior round).
- **HeatCell** value chip — digit cap-height centered in the cell.
- **BumpStrip** — end labels have symmetric gutters; `#1`/`#5` stay inside.
- **CalendarStrip** — empty (no-record) days render as outlines, distinct from
  zero-fill and future-blank (empty ≠ zero honored).
- Sparkline, SparkBar, Delta, Bullet, ActivityGrid, TrendArrow, StatusDot,
  Progress, RugStrip, MiniBar, PictogramRow, Seismogram, HeatStrip, PairedBars,
  MicroScatter, SegmentedBar, HistogramStrip, MicroBox, ProgressRing,
  MicroDonut, Funnel, Waterfall, DualSparkline, StackedArea, Ohlc, Horizon,
  EventTimeline — scanned light + dark at showcase + recipe sizes, no text
  overlap / escape / misalignment.

## Standing gates (keep these green)

- `pnpm craft` — 141 configs, 0 issues. Runs text + geometry audit.
- `core/labels.spreadLabels` — shared deterministic 1-D label nudger; reach for
  it before inventing per-chart drop-out rules.
- Every NEW chart type adds its variants to `tests/craft/matrix.mjs` in the same
  PR, and any new visual-bug class adds a detector to `audit.mjs` /
  `geometry-audit.mjs`.
