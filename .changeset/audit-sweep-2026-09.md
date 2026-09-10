---
"@microcharts/react": patch
---

A catalog-wide sweep for four defect classes, each already found once in a sibling chart:

- **Labels gated against the wrong bound.** BumpStrip, SegmentedBar, ShiftHistogram, TreeRings, Honeycomb, MicroDonut,
  CitySkyline, DataDiff, DotPlot, VolumeProfile, Thermometer (horizontal), TapeGauge (rate chevrons), Ohlc, Sparkline
  and SparkBar (`label="last"`), BreathingDot, Funnel and BubbleRow now drop a label the box cannot seat instead of
  painting it past the viewBox, stacking it on a neighbour, or collapsing the mark under it. NetFlow columns honour the
  `domain` clamp like the paths.
- **Gates that counted inputs, not painted marks.** Slope's label density counts rows with a finite endpoint;
  DualWindowMeter paints the fast reading alone when the slow window is unfilled.
- **No fabricated numbers.** ChangePoint reads `—` (never `0%`/`NaN%`) for a shift with no basis; PercentileLadder
  states no multiple over a zero median; Delta with `from={0}` shows the absolute change; Sparkline/DualSparkline
  summaries state the absolute change when the ratio overflows; ConfusionGrid, HeatCell, TreeRings, TraceFold,
  CitySkyline, DicePips, Waterfall, ErrorBudget, Hourglass and Thermometer (`±Infinity`) no longer announce, chip or
  report a value the paint does not show. RetentionCurve, QueueDepth and ShiftHistogram format the value the data holds,
  not a 2-dp rounding of it. ActivityGrid and GardenGrid paint a positive value under `domain[0]` at level 1. PolarClock
  accepts a fractional `now`. A NaN `width`/`height` no longer leaks into the markup of GradedBand, HeartbeatBlip,
  HistogramStrip, Horizon, Hypnogram, IconArray or MicroBox.
- **Interactive basis matches the static.** BurnChart, ParetoStrip, RateVolume, ForecastCone, ShiftHistogram, EtaBar and
  EnsembleGhosts reserve (or drop) the label gutter exactly as their static twin does, so the pointer map is never
  scaled past the rendered viewBox. ABStrips announces the shown row's own side of the median gap.
