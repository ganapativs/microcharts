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
4. **Interactive overlays** — covered by the 62-test browser suite
   (`*.browser.test.tsx`): readout chip text, focus-ring presence, keyboard nav.

## Findings

| # | Chart | Severity | Issue | Expectation | Status |
|---|-------|----------|-------|-------------|--------|
| 1 | Dumbbell | HIGH | Connector ran dot-center → dot-center, so it crossed the interior of the hollow "before" ring (`fill="none"`, r 1.7) and showed through — the line visibly pierced the empty dot. Present at every size, static + interactive. | Connector stops at each dot's EDGE; the hollow ring reads as a clean circle with the line meeting its rim. | **FIXED** (`src/charts/dumbbell/index.tsx`): connector endpoints inset by the mark radius along the row; if the dots nearly touch, the connector is dropped. Regression test + geometry-audit gate added. |
| 2 | Slope (docs recipes) | LOW | `KPI before/after` recipe (`label="both"`, 120×72, 5 rows) spreads the right-side labels to exactly the minimum glyph pitch (fontSize 6 → 6.3 px baseline gap). Legible and non-overlapping, but visually cramped. | More breathing room between endpoint labels. | OPEN — **not a chart bug** (the solver spreads to the density limit correctly). Fix in docs: give the recipe more height (e.g. 88–96 px) or drop to `label="value"`. |

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
