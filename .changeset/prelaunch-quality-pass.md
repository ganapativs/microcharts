---
"@microcharts/react": minor
---

Pre-launch quality pass — expanded annotation hosting, correctness fixes, and internal
consolidation. All changes are backward-compatible at their defaults; existing charts render
identically.

**Annotations on 17 value-series charts (was 2).** `Threshold`, `TargetZone`, `Marker`, and
`Callout` (from `@microcharts/react/annotations`) can now be passed as children to Sparkline,
SparkBar, MiniBar, CyclePlot, CitySkyline, ChangePoint, DualSparkline, SpreadBand, ForecastCone,
ControlStrip, QueueDepth, BurnChart, Waterfall, PercentileTrace, RetentionCurve, WinProbWorm, and
ErrorBudget. Every host resolves annotation coordinates through the same shared path, so label
sizing and containment are identical across charts.

**Correctness fixes:**

- `weekGrid` no longer crashes on a `NaN` week count or hangs on `Infinity` — non-finite inputs
  clamp to a single row.
- `divergingStack` no longer emits `NaN` segments when `neutralIndex` is out of range — an
  out-of-range index is treated as "no neutral".
- `stepOpacity` no longer divides by zero at `steps === 1` (was `Infinity`).
- The interactive MinimapStrip slider always has an accessible name, even when `summary={false}`
  and no `title` is given (falls back to the localized viewport sentence).
- Consumer-supplied annotation labels are now truncated to fit the chart's box, closing the one
  text path that could paint outside the viewBox.
- The trend-percentage in generated summaries now routes through the locale formatter, so
  non-ASCII-digit locales no longer mix numeral systems in one sentence.

**Summary strings (i18n):**

- TokenConfidence's empty-state string moved from the shared `noData` key to its own `noTokens`
  key on `SummaryStrings`, so it is no longer silently overridden by other charts' `noData`. If
  you supply custom `strings` to TokenConfidence, rename `noData` → `noTokens`. Rendered output is
  unchanged ("No tokens.").
- `compass8` is now canonically lowercase across WindBarb and StationGlyph (WindBarb capitalizes
  its sentence-initial octant in its own template), fixing lowercase sentence starts when both
  charts' strings were merged. Standalone output is unchanged.
- `heartbeatWindow` now reports clean multiples of an hour as hours ("2 hours") instead of minutes
  ("120 minutes").

Internally, duplicated label-sizing, live-region, gutter, and summary-resolution logic was
consolidated into shared helpers, and several unused internal exports were removed. No public
export, prop, or chart was added or removed.
