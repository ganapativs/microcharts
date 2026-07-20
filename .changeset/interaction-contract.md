---
"@microcharts/react": minor
---

One interaction contract across the catalog. 103 of 106 charts now share a single picker kernel, so a consumer's handler
reads the same on a Sparkline, an ActivityGrid or a MicroDonut.

**This is a pre-1.0 minor with breaking changes** — permitted under semver for a `0.x` package, but read the Breaking
section below before upgrading.

**Picker charts (84 multi-unit entries)** gain four props on their `…/interactive` entry:

- `onActive(datum | null)` — the hovered / keyboard-focused unit changed
- `onSelect(datum | null)` — a unit was activated by click, tap, `Enter` or `Space`
- `selectedIndex` / `defaultSelectedIndex` — controlled and uncontrolled selection

The payload is one shape everywhere: `MicroDatum = { index, value, label? }`. `index` identifies the navigable unit
(documented per chart — a data index where the chart is 1:1 with `data`, otherwise a unit position). `value` is that
unit's primary _encoded_ number, which may be derived — a segment's share, a run's duration, a signed gap, a bin's count
— and is `null` where the unit encodes nothing.

Behavior, everywhere: pointer scrub sets the active unit; click or tap **selects and pins** it (surviving blur);
`Enter`/`Space` select; `Escape` clears; re-selecting the same unit clears it; arrows rove on **both** axes;
`Home`/`End` jump to the ends. On touch, a tap pins and a drag scrubs. Still one listener on the wrapper and pure math —
never a listener per data point.

**Scalar charts (19 single-unit entries)** take the lean half: `onSelect` only, with `{ index: 0, value, label? }`.
There is nothing to rove between and no pinned state, so they don't pretend otherwise.

**Deliberately excluded**, and documented as such: `MinimapStrip` is a viewport-window slider and keeps its
`onWindowChange([lo, hi])` range payload; `TokenConfidence` moves real focus to per-token spans so a screen reader reads
the text in flow; `WindBarb` ships no interactive entry at all.

### Breaking

- **Removed `onPointFocus`** (Sparkline, SparkBar, and Waveform's two-argument `(index, fraction)` form) and
  **`onRunFocus`** (StreakSpark). Use `onActive`, which reports `{ index, value, label? }`. Waveform's `fraction` has no
  equivalent — the datum reports the bucket index and its peak.
- **`PictogramRow`'s interactive `strings` prop now takes `PictogramStrings`**, which adds a `pictogramUnit` template so
  roving announces each unit (it previously announced nothing — an accessibility gap). A custom `ScalarStrings` object
  needs that one template added. The static entry is unchanged.
- Charts whose interactive entry hand-rolled geometry that disagreed with their static now mirror the static exactly.
  This corrects rendered output where the two had drifted — most visibly `EventRaster` (its interactive entry rendered
  43% shorter than its static) and `Hypnogram` (default size and row-label gutter). Overlays, focus rings and hit-tests
  now land on the marks.
- Six charts that silently ignored `ArrowUp`/`ArrowDown` now accept them as prev/next, matching the rest of the catalog.

### Fixed

- Nine interactive entries dropped consumer `children`, silently discarding annotations (`<Threshold>`, `<Marker>`, …).
- `TreeRings`' pinned mark had its stroke width overridden by the stylesheet.
- `SproutRow` ignored `summary={false}`; `CometTrail` mis-indexed its readout when the series contained non-finite
  values; `ControlStrip` had an index/value misalignment on gappy data; `BalanceBeam` ignored `width`/`height`/`shape`.
- `Honeycomb` announced bare numerals to screen readers; it now uses a proper `honeycombCell` template.
- `CyclePlot`'s within-slot drill-down (`↑`/`↓` over the observations in the focused slot) is restored.
