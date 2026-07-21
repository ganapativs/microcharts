# @microcharts/react

## 0.7.0

### Minor Changes

- [#46](https://github.com/ganapativs/microcharts/pull/46)
  [`5310b1d`](https://github.com/ganapativs/microcharts/commit/5310b1dc73169ce97ba71de25cf2859891217702) Thanks
  [@ganapativs](https://github.com/ganapativs)! - **Breaking (pre-1.0 API freeze): prop-name consistency pass.** Same
  prop name must mean the same thing across the catalog. Collisions found in the pre-1.0 audit are renamed; behaviour is
  unchanged — pass the new name, get identical output.

  | Chart             | Old                       | New               | Why                                                                       |
  | ----------------- | ------------------------- | ----------------- | ------------------------------------------------------------------------- |
  | `MusicStaff`      | `range`                   | `mode`            | `range` is the peer-band recipe on `BenchmarkStrip`                       |
  | `PercentileTrace` | `bands`                   | `showBands`       | `bands` is qualitative thresholds on `Bullet`                             |
  | `FoldedDayBand`   | `bands`                   | `percentiles`     | ⇑; avoided `levels` (already `DepthWedge` / `GradedBand`)                 |
  | `Waterfall`       | `start`                   | `open`            | `start` collided with PolarClock / ActivityGrid; avoided `from` (`Delta`) |
  | `PolarClock`      | `start`                   | `origin`          | ⇑                                                                         |
  | `ActivityGrid`    | `start`                   | `anchor`          | ⇑                                                                         |
  | `OrbitStatus`     | `alert`                   | `threshold`       | Decision cutoffs spell `threshold` elsewhere                              |
  | `CyclePlot`       | `trend: "line" \| "none"` | `trend?: boolean` | Matches `MicroScatter`                                                    |

  **Also in this release:** chart polish (label defaults, annotation hosts, motion safety); interactive scrub/HOP
  re-render wins (picker SVG cache, Sparkline memo overlays, EnsembleGhosts DOM hop); size sync tolerates over-budget
  `size-limit --json`; marketing band **~2–7 kB interactive · ~1–4 kB static**.

  **Non-breaking:** `MicroDatum.formatted` + `readout` on interactive pickers (hide in-chart chip, render the chart's
  own display string elsewhere); empty-state `seat` on 11 charts; `LiveRegion` on dice-pips / tally-marks / hourglass;
  `data-mc-ink` on Slope + forced-colors for `data-mc-status`; Delta / Bullet / ActivityGrid / TokenConfidence English
  via `strings-*`; core `clamp` / `lastFinite` reuse; docs registry + MDX synced (catalog.json / llms surfaces
  regenerate); gallery collections + comparison/SEO doc pages; CI splits `core`/`dom`/`browser` projects.

  Examples microsites migrate after publish — not in this release.

## 0.6.0

### Minor Changes

- [#42](https://github.com/ganapativs/microcharts/pull/42)
  [`86dcf8e`](https://github.com/ganapativs/microcharts/commit/86dcf8e9066c801f4cfe935a52d2ff2bd6ee2d37) Thanks
  [@ganapativs](https://github.com/ganapativs)! - **Breaking (pre-1.0 API freeze): remove props that were declared but
  never read.** Each of these was accepted by the type signature and documented, but had no effect on rendering,
  geometry, or the accessible summary — passing one did nothing. They are gone rather than fixed where the chart had no
  number and no announcement to apply them to.

  Removed outright:

  - `DualSparkline` — `compareLabel`. Never reached the summary or any announcement; the compare series is described
    positionally.
  - `DualWindowMeter` — `damping`. Documented as "ballistics for the live entry", but the interactive entry never read
    it; its motion comes from the shared entrance engine.

  Narrowed to the interactive entry only (still available on `…/interactive`, removed from the static default export,
  where they did nothing):

  - `PercentileTrace` — `unit`. Names the reading in the hover/focus announcement; the static entry announces
    percentiles, not individual readings.
  - `CalendarStrip`, `EventRaster`, `MicroScatter`, `TokenConfidence` — `locale` (and `format` on the latter three).
    These statics render lane names, marks and text, never a formatted number; only the readout does.

  Wired up instead of removed:

  - `ConfusionGrid` — `format` / `locale` now reach the accuracy gutter label, which previously hard-coded
    `Math.round(v * 100) + "%"`. Percent formatting goes through the shared cached `makeFormatter`, so the one number
    this chart renders is locale-aware and honors a custom `format`. Default output is unchanged. The right-hand gutter
    is measured from the produced string, so a locale that widens the label still fits inside the viewBox.

- [#42](https://github.com/ganapativs/microcharts/pull/42)
  [`86dcf8e`](https://github.com/ganapativs/microcharts/commit/86dcf8e9066c801f4cfe935a52d2ff2bd6ee2d37) Thanks
  [@ganapativs](https://github.com/ganapativs)! - One interaction contract across the catalog. 103 of 106 charts now
  share a single picker kernel, so a consumer's handler reads the same on a Sparkline, an ActivityGrid or a MicroDonut.

  **This is a pre-1.0 minor with breaking changes** — permitted under semver for a `0.x` package, but read the Breaking
  section below before upgrading.

  **Picker charts (84 multi-unit entries)** gain four props on their `…/interactive` entry:

  - `onActive(datum | null)` — the hovered / keyboard-focused unit changed
  - `onSelect(datum | null)` — a unit was activated by click, tap, `Enter` or `Space`
  - `selectedIndex` / `defaultSelectedIndex` — controlled and uncontrolled selection

  The payload is one shape everywhere: `MicroDatum = { index, value, label? }`. `index` identifies the navigable unit
  (documented per chart — a data index where the chart is 1:1 with `data`, otherwise a unit position). `value` is that
  unit's primary _encoded_ number, which may be derived — a segment's share, a run's duration, a signed gap, a bin's
  count — and is `null` where the unit encodes nothing.

  Behavior, everywhere: pointer scrub sets the active unit; click or tap **selects and pins** it (surviving blur);
  `Enter`/`Space` select; `Escape` clears; re-selecting the same unit clears it; arrows rove on **both** axes;
  `Home`/`End` jump to the ends. On touch, a tap pins and a drag scrubs. Still one listener on the wrapper and pure math
  — never a listener per data point.

  **Scalar charts (19 single-unit entries)** take the lean half: `onSelect` only, with `{ index: 0, value, label? }`.
  There is nothing to rove between and no pinned state, so they don't pretend otherwise.

  **Deliberately excluded**, and documented as such: `MinimapStrip` is a viewport-window slider and keeps its
  `onWindowChange([lo, hi])` range payload; `TokenConfidence` moves real focus to per-token spans so a screen reader
  reads the text in flow; `WindBarb` ships no interactive entry at all.

  ### Breaking
  - **Removed `onPointFocus`** (Sparkline, SparkBar, and Waveform's two-argument `(index, fraction)` form) and
    **`onRunFocus`** (StreakSpark). Use `onActive`, which reports `{ index, value, label? }`. Waveform's `fraction` has
    no equivalent — the datum reports the bucket index and its peak.
  - **`PictogramRow`'s interactive `strings` prop now takes `PictogramStrings`**, which adds a `pictogramUnit` template
    so roving announces each unit (it previously announced nothing — an accessibility gap). A custom `ScalarStrings`
    object needs that one template added. The static entry is unchanged.
  - Charts whose interactive entry hand-rolled geometry that disagreed with their static now mirror the static exactly.
    This corrects rendered output where the two had drifted — most visibly `EventRaster` (its interactive entry rendered
    43% shorter than its static) and `Hypnogram` (default size and row-label gutter). Overlays, focus rings and
    hit-tests now land on the marks.
  - Six charts that silently ignored `ArrowUp`/`ArrowDown` now accept them as prev/next, matching the rest of the
    catalog.

  ### Fixed
  - Nine interactive entries dropped consumer `children`, silently discarding annotations (`<Threshold>`, `<Marker>`,
    …).
  - `TreeRings`' pinned mark had its stroke width overridden by the stylesheet.
  - `SproutRow` ignored `summary={false}`; `CometTrail` mis-indexed its readout when the series contained non-finite
    values; `ControlStrip` had an index/value misalignment on gappy data; `BalanceBeam` ignored
    `width`/`height`/`shape`.
  - `Honeycomb` announced bare numerals to screen readers; it now uses a proper `honeycombCell` template.
  - `CyclePlot`'s within-slot drill-down (`↑`/`↓` over the observations in the focused slot) is restored.

- [#42](https://github.com/ganapativs/microcharts/pull/42)
  [`86dcf8e`](https://github.com/ganapativs/microcharts/commit/86dcf8e9066c801f4cfe935a52d2ff2bd6ee2d37) Thanks
  [@ganapativs](https://github.com/ganapativs)! - Interactive charts now forward `className` and `style` to their
  wrapper and size the inner SVG from one shared `FILL` constant, so the SVG always fills the interactive `<span>` —
  hover math, crosshairs, and focus rings stay locked to the cursor instead of drifting when the chart is scaled by a
  consumer. Passing `style` merges (it no longer clobbers the wrapper's `display`/`position`/`line-height`), and
  `className` composes with the chart's own class. No change at rest — static output is byte-identical.

  Formatters are also hardened against IEEE float noise: `makeFormatter` snaps its input to 12 significant digits before
  handing it to `Intl` or a custom `format` function, so internally-derived values (`value - target` →
  `-3.5999999999999943`) render clean without touching real precision.

- [#42](https://github.com/ganapativs/microcharts/pull/42)
  [`86dcf8e`](https://github.com/ganapativs/microcharts/commit/86dcf8e9066c801f4cfe935a52d2ff2bd6ee2d37) Thanks
  [@ganapativs](https://github.com/ganapativs)! - Prop-name grammar freeze. Non-negotiable
  [#4](https://github.com/ganapativs/microcharts/issues/4) says the same prop name means the same thing on every chart —
  an API audit before 1.0 found several names carrying two meanings across the catalog. Each is now spelled one way.

  **This is a pre-1.0 minor with breaking renames** — permitted under semver for a `0.x` package. Every rename below is
  mechanical: pass the new name, get identical output. No rendering, geometry, or accessibility behaviour changed.

  | Chart              | Old             | New             | Why                                                               |
  | ------------------ | --------------- | --------------- | ----------------------------------------------------------------- |
  | `ABStrips`         | `labels`        | `seriesLabels`  | `labels` is a boolean show/hide toggle on 11 other charts         |
  | `ShiftHistogram`   | `labels`        | `seriesLabels`  | ⇑                                                                 |
  | `SpreadBand`       | `labels`        | `seriesLabels`  | ⇑                                                                 |
  | `Waterfall`        | `total`         | `totalBar`      | `total` is a number denominator on 5 other charts                 |
  | `ChangePoint`      | `max`           | `maxItems`      | `max` is a scale denominator on `Progress` (mirrors `<progress>`) |
  | `DataDiff`         | `max`           | `maxItems`      | ⇑                                                                 |
  | `ParetoStrip`      | `max`           | `maxItems`      | ⇑                                                                 |
  | `CalibrationStrip` | `variant`       | `mode`          | 13 charts already spelled this `mode`                             |
  | `Hypnogram`        | `variant`       | `mode`          | ⇑                                                                 |
  | `MinimapStrip`     | `variant`       | `mode`          | ⇑                                                                 |
  | `Ohlc`             | `variant`       | `mode`          | ⇑                                                                 |
  | `StackedArea`      | `variant`       | `mode`          | ⇑                                                                 |
  | `Waveform`         | `variant`       | `mode`          | ⇑                                                                 |
  | `WindBarb`         | `variant`       | `mode`          | ⇑                                                                 |
  | `DataDiff`         | `sort`          | `order`         | `sort`/`order` were two names for one concept                     |
  | `MiniBar`          | `sort`          | `order`         | ⇑                                                                 |
  | `PhaseTrace`       | `yDomain`       | `domain`        | its three sibling xy-charts use `domain` + `xDomain`              |
  | `EtaBar`           | `formatEta`     | `etaFormat`     | formatter props read `<thing>Format` everywhere else              |
  | `PolarClock`       | `formatSegment` | `segmentFormat` | ⇑                                                                 |

  **Value renames.** The ordering vocabulary is now `"data" | "asc" | "desc"` plus per-chart extras, so `"none"` and
  `"data"` no longer spell the same state:

  - `DataDiff` `order`: `"none"` → `"data"` (`"net"`, `"magnitude"` unchanged)
  - `MiniBar` `order`: `"none"` → `"data"` (`"desc"`, `"asc"` unchanged)

  `SegmentedBar` (`"data" | "desc"`) and `StackedArea` (`"data" | "asc"`) already complied and are untouched.

  **Additive.** `ControlStrip` gains `dots="none"` — it was the only `dots` prop in the catalog without the escape
  hatch, so `dots="none"` was a type error on that one chart. It now draws no point marks at all, matching `Sparkline`,
  `BumpStrip`, `RateVolume` and `StarSpoke`.

  `Progress` keeps `max`: it is a true scale denominator and mirrors the web platform's own `<progress value max>`.

- [#42](https://github.com/ganapativs/microcharts/pull/42)
  [`86dcf8e`](https://github.com/ganapativs/microcharts/commit/86dcf8e9066c801f4cfe935a52d2ff2bd6ee2d37) Thanks
  [@ganapativs](https://github.com/ganapativs)! - `defineTheme()` gains a **`strokeWidth`** token — pin the base data
  stroke weight (`--mc-stroke-width`) alongside the other geometry/type tokens. A number is stringified as-is (not
  twinned into the dark variant). Additive and identity at its default.

### Patch Changes

- [#42](https://github.com/ganapativs/microcharts/pull/42)
  [`86dcf8e`](https://github.com/ganapativs/microcharts/commit/86dcf8e9066c801f4cfe935a52d2ff2bd6ee2d37) Thanks
  [@ganapativs](https://github.com/ganapativs)! - Floor charts now seat their baseline flush with the box bottom so they
  align on the text baseline when rendered inline: SparkBar (bar mode), StackedArea, DepthWedge, and GradeProfile. These
  marks are flat fill edges (crispEdges rects / stroke-free, dot-free areas), so filling to the box bottom bleeds
  nothing; the top pad is untouched. SparkBar win-loss keeps its symmetric mid-line inset. No API change.

- [#42](https://github.com/ganapativs/microcharts/pull/42)
  [`86dcf8e`](https://github.com/ganapativs/microcharts/commit/86dcf8e9066c801f4cfe935a52d2ff2bd6ee2d37) Thanks
  [@ganapativs](https://github.com/ganapativs)! - Pre-1.0 hardening pass. Every fix below is behavioural correctness —
  no public prop changed (those are in the separate grammar-freeze changeset). Each is now guarded by a catalog-wide
  test so it can't regress.

  **Inline sizing parity (was a blocker).** A chart switched to its `/interactive` entry took a different amount of
  space on the line than its static twin. Two causes: the `.mc-inline` glyph rules were direct-child selectors the
  interactive wrapper broke, and CSS sizing (`height: 1.2em`, `width: 100%`) reached the wrapper but not the composed
  SVG, so the mark kept its authored pixel size and overflowed. Static and interactive now occupy an identical box at
  every size — verified across the whole catalog.

  **Pointer accuracy.** Twelve interactive charts reported the wrong unit under the cursor. Causes ranged from a
  hit-test index computed against a filtered array while read back against the unfiltered one (`Ohlc` — candles after a
  corrupt period reported their neighbour's values), to a controlled-selection round trip off by one per gap
  (`RetentionCurve`), a `variant="envelope"` waveform hit-tested on the bar pitch, a fixed hit radius against a
  size-proportional dot (`QuadrantDot`), phantom navigable units on all-zero data (`ParetoStrip`, `PercentileLadder`),
  and a focus ring that CSS-lerped across the chart while roving (`BalanceBeam`).

  **Focus-ring symmetry.** Rings now sit concentric around the marks they enclose (`PairedBars`, `SproutRow`,
  `Waterfall`) instead of hugging a band the mark sits off-centre in.

  **Renders safely on degenerate input.** Twelve charts previously threw or leaked `NaN`/`undefined` into markup and
  accessible names on empty, all-null, or `NaN`/±Infinity data. A null value now reads as "no data" — visible but
  distinct from a real zero — never a fabricated measurement.

  **Degrades at small sizes.** Thirty-two charts overlapped or spilled their labels outside the viewBox when the box
  shrank (a Dumbbell in a tab header stacked its row names; a Thermometer squashed to a blob). Labels now drop cleanly —
  with their reserved gutter, without reflowing the plot — so every chart stays legible down to at least half its
  default size.

  **Accessibility.** A decorative interactive chart (`summary={false}`, no `title`) was a focusable `role="img"` with no
  accessible name; it is now correctly `aria-hidden` and non-focusable, matching the static entry.

## 0.5.0

### Minor Changes

- [#40](https://github.com/ganapativs/microcharts/pull/40)
  [`427c25a`](https://github.com/ganapativs/microcharts/commit/427c25a1cde274893ec4234808003ef08cc54c33) Thanks
  [@ganapativs](https://github.com/ganapativs)! - `defineTheme()` gains a **`strokeWidth`** token — pin the base data
  stroke weight (`--mc-stroke-width`) alongside the other geometry/type tokens. A number is stringified as-is (not
  twinned into the dark variant). Additive and identity at its default.

### Patch Changes

- [#40](https://github.com/ganapativs/microcharts/pull/40)
  [`427c25a`](https://github.com/ganapativs/microcharts/commit/427c25a1cde274893ec4234808003ef08cc54c33) Thanks
  [@ganapativs](https://github.com/ganapativs)! - Floor charts now seat their baseline flush with the box bottom so they
  align on the text baseline when rendered inline: SparkBar (bar mode), StackedArea, DepthWedge, and GradeProfile. These
  marks are flat fill edges (crispEdges rects / stroke-free, dot-free areas), so filling to the box bottom bleeds
  nothing; the top pad is untouched. SparkBar win-loss keeps its symmetric mid-line inset. No API change.

## 0.4.0

### Minor Changes

- [#38](https://github.com/ganapativs/microcharts/pull/38)
  [`0796194`](https://github.com/ganapativs/microcharts/commit/0796194d9ae0658ed98bfe9d3aa4f93e50e9e8ee) Thanks
  [@ganapativs](https://github.com/ganapativs)! - Pre-launch quality pass — expanded annotation hosting, correctness
  fixes, and internal consolidation. All changes are backward-compatible at their defaults; existing charts render
  identically.

  **Annotations on 17 value-series charts (was 2).** `Threshold`, `TargetZone`, `Marker`, and `Callout` (from
  `@microcharts/react/annotations`) can now be passed as children to Sparkline, SparkBar, MiniBar, CyclePlot,
  CitySkyline, ChangePoint, DualSparkline, SpreadBand, ForecastCone, ControlStrip, QueueDepth, BurnChart, Waterfall,
  PercentileTrace, RetentionCurve, WinProbWorm, and ErrorBudget. Every host resolves annotation coordinates through the
  same shared path, so label sizing and containment are identical across charts.

  **Correctness fixes:**

  - `weekGrid` no longer crashes on a `NaN` week count or hangs on `Infinity` — non-finite inputs clamp to a single row.
  - `divergingStack` no longer emits `NaN` segments when `neutralIndex` is out of range — an out-of-range index is
    treated as "no neutral".
  - `stepOpacity` no longer divides by zero at `steps === 1` (was `Infinity`).
  - The interactive MinimapStrip slider always has an accessible name, even when `summary={false}` and no `title` is
    given (falls back to the localized viewport sentence).
  - Consumer-supplied annotation labels are now truncated to fit the chart's box, closing the one text path that could
    paint outside the viewBox.
  - The trend-percentage in generated summaries now routes through the locale formatter, so non-ASCII-digit locales no
    longer mix numeral systems in one sentence.

  **Summary strings (i18n):**

  - TokenConfidence's empty-state string moved from the shared `noData` key to its own `noTokens` key on
    `SummaryStrings`, so it is no longer silently overridden by other charts' `noData`. If you supply custom `strings`
    to TokenConfidence, rename `noData` → `noTokens`. Rendered output is unchanged ("No tokens.").
  - `compass8` is now canonically lowercase across WindBarb and StationGlyph (WindBarb capitalizes its sentence-initial
    octant in its own template), fixing lowercase sentence starts when both charts' strings were merged. Standalone
    output is unchanged.
  - `heartbeatWindow` now reports clean multiples of an hour as hours ("2 hours") instead of minutes ("120 minutes").

  Internally, duplicated label-sizing, live-region, gutter, and summary-resolution logic was consolidated into shared
  helpers, and several unused internal exports were removed. No public export, prop, or chart was added or removed.

- [#38](https://github.com/ganapativs/microcharts/pull/38)
  [`0796194`](https://github.com/ganapativs/microcharts/commit/0796194d9ae0658ed98bfe9d3aa4f93e50e9e8ee) Thanks
  [@ganapativs](https://github.com/ganapativs)! - Deepen the theming surface — all additive, backward-compatible, and
  identity at their defaults (no visual change to existing charts):

  - **`defineTheme()`** — a new opt-in `@microcharts/react/theme` subpath (zero runtime deps, ~2 kB gzip, tree-shaken
    when unused). Give it one brand accent and it derives a harmonized, colour-blind-safe categorical palette and
    hand-tuned-style dark twins in-house in OKLCH — never moving the positive/negative hues off their CVD-safe split.
    Extend a preset, pin any token, pass an explicit palette, or `extend()` a variant; returns `vars` / `style` /
    `css(selector)` (with a `prefers-color-scheme: dark` block).
  - **New tokens** — `--mc-font-numeric` (a dedicated face for figures, tracks `--mc-font` by default),
    `--mc-label-weight`, and `--mc-density` (one scalar that scales stroke weight, label size, and small-multiple gap
    together for compact vs comfortable layouts; the plot box is untouched).
  - **`colors` prop** — per-instance series colours on the categorical charts (`SegmentedBar`, `StackedArea`,
    `PartitionStrip`, `Hypnogram`, `MicroDonut`), overriding `--mc-cat-*` just there.
  - **`print` and `eink` presets** — output-context token bundles for paper and grayscale e-paper, answering
    `data-mc-theme` / `data-mc-preset` like the rest.

  The `MicrochartCommonProps` shared-grammar type is now enforced as a single source of truth: a guard test holds every
  chart's shared props to its canonical types.

### Patch Changes

- [#38](https://github.com/ganapativs/microcharts/pull/38)
  [`0796194`](https://github.com/ganapativs/microcharts/commit/0796194d9ae0658ed98bfe9d3aa4f93e50e9e8ee) Thanks
  [@ganapativs](https://github.com/ganapativs)! - Ship a **minified** `styles.css`. `@microcharts/react/styles.css` (and
  the per-chart `styles/*.css` escape-hatch files) now resolve to minified copies in `dist/` — the shared stylesheet
  drops from ~8.7 kB to ~2.8 kB gzip. The minifier only strips comments and whitespace (no rule merging), so `@layer`
  membership and cascade order are unchanged. The repo-root `styles.css` stays the unminified source of truth; no API or
  visual changes.

- [#38](https://github.com/ganapativs/microcharts/pull/38)
  [`0796194`](https://github.com/ganapativs/microcharts/commit/0796194d9ae0658ed98bfe9d3aa4f93e50e9e8ee) Thanks
  [@ganapativs](https://github.com/ganapativs)! - Improve npm and search discoverability: expand `keywords`, add a
  `funding` link (GitHub Sponsors), and a structured `author` (name/email/url). Metadata only — no API, runtime, or
  visual changes.

## 0.3.0

### Minor Changes

- [#23](https://github.com/ganapativs/microcharts/pull/23)
  [`c5854a0`](https://github.com/ganapativs/microcharts/commit/c5854a05d5360ec189f7dbb283efbb9e8e8a4852) Thanks
  [@ganapativs](https://github.com/ganapativs)! - Deepen the theming surface — all additive, backward-compatible, and
  identity at their defaults (no visual change to existing charts):

  - **`defineTheme()`** — a new opt-in `@microcharts/react/theme` subpath (zero runtime deps, ~2 kB gzip, tree-shaken
    when unused). Give it one brand accent and it derives a harmonized, colour-blind-safe categorical palette and
    hand-tuned-style dark twins in-house in OKLCH — never moving the positive/negative hues off their CVD-safe split.
    Extend a preset, pin any token, pass an explicit palette, or `extend()` a variant; returns `vars` / `style` /
    `css(selector)` (with a `prefers-color-scheme: dark` block).
  - **New tokens** — `--mc-font-numeric` (a dedicated face for figures, tracks `--mc-font` by default),
    `--mc-label-weight`, and `--mc-density` (one scalar that scales stroke weight, label size, and small-multiple gap
    together for compact vs comfortable layouts; the plot box is untouched).
  - **`colors` prop** — per-instance series colours on the categorical charts (`SegmentedBar`, `StackedArea`,
    `PartitionStrip`, `Hypnogram`, `MicroDonut`), overriding `--mc-cat-*` just there.
  - **`print` and `eink` presets** — output-context token bundles for paper and grayscale e-paper, answering
    `data-mc-theme` / `data-mc-preset` like the rest.

  The `MicrochartCommonProps` shared-grammar type is now enforced as a single source of truth: a guard test holds every
  chart's shared props to its canonical types.

### Patch Changes

- [#23](https://github.com/ganapativs/microcharts/pull/23)
  [`c5854a0`](https://github.com/ganapativs/microcharts/commit/c5854a05d5360ec189f7dbb283efbb9e8e8a4852) Thanks
  [@ganapativs](https://github.com/ganapativs)! - Ship a **minified** `styles.css`. `@microcharts/react/styles.css` (and
  the per-chart `styles/*.css` escape-hatch files) now resolve to minified copies in `dist/` — the shared stylesheet
  drops from ~8.7 kB to ~2.8 kB gzip. The minifier only strips comments and whitespace (no rule merging), so `@layer`
  membership and cascade order are unchanged. The repo-root `styles.css` stays the unminified source of truth; no API or
  visual changes.

- [#23](https://github.com/ganapativs/microcharts/pull/23)
  [`c5854a0`](https://github.com/ganapativs/microcharts/commit/c5854a05d5360ec189f7dbb283efbb9e8e8a4852) Thanks
  [@ganapativs](https://github.com/ganapativs)! - Improve npm and search discoverability: expand `keywords`, add a
  `funding` link (GitHub Sponsors), and a structured `author` (name/email/url). Metadata only — no API, runtime, or
  visual changes.

## 0.2.1

### Patch Changes

- 3955472: Fix subpath resolution on StackBlitz and some CDNs. Every export now includes a `default` condition alongside
  `import`, so imports like `@microcharts/react/sparkline/interactive` resolve on loose resolvers that don't request the
  `import` condition (they previously failed with "file does not exist"). Also ship a **minified** dist — smaller
  install, and correct bytes for consumers that import the ESM directly (Deno, CDNs). No API changes.

## 0.2.0

### Minor Changes

- ef2df66: Ship the full catalog: 106 stable chart types (34 core, 26 decision, 23 expressive, 23 frontier), each with a
  static React Server Component entry and an `/interactive` twin, an auto-generated accessible summary, opt-in mount
  animation via `@microcharts/react/motion`, and a CI-gated size budget. Zero runtime dependencies; one shared
  `styles.css`. First public release usable end to end.

## 0.1.0

### Minor Changes

- 69eb408: Batch 1 wave 1 — four scalar glyph charts, each with a static RSC-safe entry and an interactive
  `/interactive` entry:

  - `TrendArrow` (`./trend-arrow`) — direction glyph (arrow/triangle/chevron), `flatBand` noise floor, `showValue`
    gutter, `positive` polarity.
  - `StatusDot` (`./status-dot`) — five paired shape+color states (ok/warn/error/off/busy), `pulse` halo, extensible
    `states` vocabulary.
  - `HeatCell` (`./heat-cell`) — one calibrated color step (shared 5-step ramp), shared `shape` cell vocabulary,
    optional centered value label.
  - `Progress` (`./progress`) — zero-anchored bar + direct percent label, `segments` stepped mode, honest >100% clamp
    (label carries the truth), burn-down wording.

  Also: `EN` locale dictionary is now composed from per-shape modules (`EN_SERIES` + `EN_SCALAR`) so each chart bundles
  only its own summary templates; new `ScalarStrings` keys `scalarDir`, `flatChange`, `status`, `level`, `progress`,
  `remaining`, `stepsDone`.

- 16a3914: Batch 1 wave 2 — five tick/cell strip charts, each with static + `/interactive` entries:

  - `RugStrip` (`./rug-strip`) — raw observations as ticks, density via opacity tiers, `highlight` for "you are here",
    never downsamples.
  - `MiniBar` (`./mini-bar`) — zero-anchored categorical bars, honest data order, `sort`, `highlight`, signed data with
    `positive` polarity.
  - `PictogramRow` (`./pictogram-row`) — countable units (●●●○○), true fractional units as circular segments (no
    clipPath ids), `renderPoint` escape hatch.
  - `Seismogram` (`./seismogram`) — event density/intensity ticks, `barcode` mode, spike-preserving max-per-bucket
    downsampling, summaries always from raw values.
  - `HeatStrip` (`./heat-strip`) — 1×N calibrated intensity cells sharing ActivityGrid's vocabulary; empty ≠ zero;
    density-adaptive gaps.

  Kernel fix: `scaleLinear` now treats denormal-span domains as degenerate (the slope overflowed to ±Infinity and
  `0 × Infinity` poisoned coordinates with NaN). New summary template modules: `EN_CATEGORY`, `EN_DIST`, `EN_SLOTS`
  (slot-empty announcements — also fixes the latent "No data.." double period in ActivityGrid's null-cell announcement).

- 7bb9ee1: Batch 1 wave 3 — five categorical/relationship charts, each with static + `/interactive` entries:

  - `DotPlot` (`./dot-plot`) — named values on one scale; `stem` flips to a zero-anchored magnitude read; deterministic
    label drop-out and coincident-dot de-overlap.
  - `Dumbbell` (`./dumbbell`) — hollow→filled before/after per row; `positive` valence for changes (documented: drop it
    for ranges).
  - `PairedBars` (`./paired-bars`) — actual vs reference on ONE zero-anchored domain; grouped or overlay-ghost modes;
    ref muted by opacity AND width.
  - `Slope` (`./slope`) — two aligned columns, one y-domain; neutral until `positive`; greedy endpoint-label dedup;
    dashed "incomplete" stubs for missing ends.
  - `MicroScatter` (`./micro-scatter`) — 2-D position + Pearson r in the summary (claim and evidence travel together);
    linear-only least-squares `trend`; `focal` point.

  New summary template modules: `EN_PAIRED` (fromTo/pairs/slopes…), `EN_SCATTER` (count + relationship tiers).
  Pluralization fixes in `categories`/`pairs` templates.

- 0c92adc: Batch 1 wave 4 — the annotations layer + seven part-to-whole/staged charts:

  - `@microcharts/react/annotations` — `<Threshold>`, `<TargetZone>`, `<Marker celebrate?>`, `<Callout>` as declarative
    children; hosts pay only a tiny walker (mark renderers ship with this entry). Sparkline/SparkBar retrofitted as
    hosts.
  - `SegmentedBar` (`./segmented-bar`) — composition with a labeled Other rollup + largest-remainder percents.
  - `HistogramStrip` (`./histogram-strip`) — ≤ 12 uniform bins from raw observations; value `highlight`.
  - `MicroBox` (`./micro-box`) — five-number box; min-max or tukey whiskers; refuses fake boxes (< 5 raw values → dots;
    non-monotonic stats → refused).
  - `ProgressRing` (`./progress-ring`) — fixed 12-o'clock arc, butt caps, `sweep` countdown mode; threshold-crossing
    announcements.
  - `MicroDonut` (`./micro-donut`) — ≤ 4 wedges + Other; `decorative` ornament mode.
  - `Funnel` (`./funnel`) — stepped columns + retained-share slats; rate-of-first mode; inversion notes.
  - `LikertStrip` (`./likert-strip`) — diverging valence bar; split/omit neutral (never silently dropped); ends/net
    labels.

  New `EN_COMPOSITION` string module + distribution templates (binAt, distribution, fiveNum, boxStat). Sparkline budget
  3.65/4.65 kB pending sign-off (annotations walker).

- 15b0a12: Batch 1 wave 5 — six composed-series charts:

  - `Waterfall` (`./waterfall`) — signed deltas bridging into a total; zero-anchored total bar on by default;
    `positive="down"` for cost bridges.
  - `BumpStrip` (`./bump-strip`) — rank trajectory on an inverted ordinal scale (#1 on top); change dots; "#5" → "#1"
    end labels; null = unranked gap.
  - `DualSparkline` (`./dual-sparkline`) — series vs benchmark on ONE shared domain; dashed/thinner/neutral reference;
    coincident-endpoint dedup. `curve="step"` renders as linear (documented — keeps the entry inside the 3 kB hard cap).
  - `StackedArea` (`./stacked-area`) — share-normalized stack, ≤ 3 series; `variant="ridge"` skin; `order="asc"`.
  - `Ohlc` (`./ohlc`) — candle/bars price action, ≤ 20 periods rendered (never averaged); valence + geometry encode
    direction.
  - `Horizon` (`./horizon`) — 2–3 fold horizon band; mirror/offset modes; authored `baseline`; summaries read the
    unfolded values.

  `EN_COMPOSED` split into per-chart string modules (`EN_FLOW`/`EN_VS`/`EN_STACK`/ `EN_OHLC`) so no chart pays for
  another family's templates. Horizon `domain` prop is now actually wired to the geometry (was silently ignored).

- cf601c5: Batch 1 wave 6 — the two date-structured charts, completing the core-29:

  - `CalendarStrip` (`./calendar-strip`) — the last few weeks day by day on a real weeks × 7 UTC calendar grid; value
    days step the shared intensity ramp, zero days show the track, no-record days render as outlines (empty ≠ zero),
    future days are blank. 2-D keyboard nav announces real calendar days.
  - `EventTimeline` (`./event-timeline`) — spans + point-event diamonds on one linear time axis; window clipping is
    flat-cut honest; coverage merges intervals (overlaps never double-count); authored `now` tick.

  New core: cached `makeDateFormatter` (UTC-forced for calendar charts) + `EN_CALENDAR`/ `EN_TIMELINE` string modules.
  `core/calendar` split into `calendar` (day parsing) and `calendar-grid` (week-grid/year math) so ActivityGrid stops
  carrying grid math it never calls. Fixed: `normalizeShares` could emit a negative share when the float remainder
  landed on a denormal-tiny entry (property-test counterexample) — remainder now folds into the largest share.

- 425f933: Batch 2 wave 1 — five decision micrographs, each with a static RSC-safe entry and an interactive
  `/interactive` entry:

  - `CoverageStrip` (`./coverage-strip`) — presence/absence on a time strip; `null` (no measurement) is hollow, `0` (a
    measured zero) is filled, so absence never masquerades as zero. `expected` makes trailing missingness count;
    `mode="intensity"` shades measured cells; `label="percent"`.
  - `BenchmarkStrip` (`./benchmark-strip`) — a focal dot against the peers' empirical quantile bands; the stated
    percentile uses a mid-rank rule; small samples fall back to min–max. `range`, `median`, `label`, `positive`.
  - `PercentileLadder` (`./percentile-ladder`) — p50/p90/p99 as graduated ticks on a zero-anchored track; `scale="log"`
    renders an in-chart `log` tag (never silent); `ps`, `label`, `dots`.
  - `GradedBand` (`./graded-band`) — nested central intervals graded by opacity, never a bar from zero; `levels` (1–3),
    `value` dot, `softEdge`, `label="median"`.
  - `IconArray` (`./icon-array`) — one rate made countable in a fixed N-unit grid with the denominator visible; no
    partial-unit fills (sub-unit rates are flagged); `of` (10/20/100), `label`, `shape`, `positive`.

  Also: new per-family summary-string modules `EN_COVERAGE`, `EN_QUANTILE`, `EN_FREQ` (each chart bundles only its own
  templates) and the corresponding `SummaryStrings` keys.

- 425f933: Batch 2 wave 2 — `BurnChart` (`./burn-chart`), static + `/interactive` entries:

  - `BurnChart` — a dashed **plan** line (full length to the deadline), the solid **actual** line to today, a today
    tick, and a **dotted projection** whose slope is a linear fit over the last `max(2, ⌈today/3⌉)` actual points —
    provisional by construction, never a smoothed or optimistic curve. `label="gap"` states the signed schedule landing
    vs the deadline (e.g. `+2 d`), colored by valence with the sign in text. `mode="down" | "up"`, `projection={false}`
    for retrospectives. A flattened recent burn never reaches zero: no landing, and the summary says "not finishing at
    the current pace" outright.

  New `EN_BURN` summary module (`burn`, `burnNoPlan`, `burnLanding`, `burnFlatlined`, `burnAt`, `burnAtProjected`,
  `burnRemain`/`burnDone`).

- 425f933: Batch 2 wave 2 — `ControlStrip` (`./control-strip`), static + `/interactive` entries:

  - `ControlStrip` — a Shewhart individuals control chart: the band is center ± 3σ̂ where **σ̂ = mean moving range ÷
    1.128** (the individuals estimator, stated — sample SD is not used, it inflates limits under drift). In-control
    points are bare vertices; only out-of-control points are marked (ringed, negative). `limits="sigma" | "percentile"`
    (empirical p0.135/p99.865 for skew), `baseline` for a golden-period center, `rules="we"` for the enumerated Western
    Electric subset (WE-1/2/4, no rule fires silently), `dots="all"` for sparse series. Fewer than 10 points → dashed
    band - "limits provisional"; zero moving range → band collapses to the center hairline.

  New `EN_CONTROL` summary module (`control`, `controlInControl`, `controlProvisional`, `controlAt`).

- 425f933: Batch 2 wave 2 — `ErrorBudget` (`./error-budget`), static + `/interactive` entries:

  - `ErrorBudget` — budget remaining (0–1) against the **steady-burn diagonal** (the pace that exactly spends the SLO
    window); below the diagonal = burning too fast. Faster burn-rate reference lines (the Google-SRE 1×/6×/14.4×
    **convention**, not physics) render as faint region context, never data ink; `rates` is configurable. `window` sets
    the full window length (so "now" can sit mid-window); `currentRate` is the observed slope over the last
    `max(2, ⌈n/6⌉)` steps ÷ steady. A budget that hits 0 before the window ends stops at an ✕ and the summary reads
    "Budget exhausted at day N of M." Values outside [0,1] are clamped.

  New `EN_ERROR_BUDGET` summary module (`errorBudget`, `errorBudgetExhausted`, `errorBudgetAt`).

- 425f933: Batch 2 wave 2 — `ForecastCone` (`./forecast-cone`), static + `/interactive` entries:

  - `ForecastCone` — history as a solid line, then a fan of prediction bands (p80 outer, p50 inner) widening over the
    horizon with a **dashed** median. The fan's entire honesty is visible confidence decay, so three rules are enforced,
    not offered as options: at most 2 bands (a 95% band reads as false tail confidence at micro scale), the median is
    always dashed (an estimate never renders as fact), and a cone that fails to widen is flagged (`widening: false`),
    never auto-inflated. An optional `target` line adds a clearance clause (clears / straddles / misses). Reversed
    `[hi, lo]` pairs are swapped; empty history renders a cone-only cell.

  New `EN_FORECAST` summary module (`forecast`, `forecastClearance`, `forecastAtHistory`, `forecastAtForecast`). The
  interactive entry is region-aware (history value vs forecast median + interval). The `softEdge`/`curve` cosmetic
  variants are deferred (plan/12).

- 425f933: Batch 2 wave 2 — `NetFlow` (`./net-flow`), static + `/interactive` entries:

  - `NetFlow` — inflow area above a zero baseline, outflow mirrored below on **one shared magnitude scale** (never
    independently balanced), with the net line (`in − out`) on top restoring the precise decision value.
    `mode="area" | "bars"` (bars, and single periods, avoid an area through one point); `net={false}` for gross flows
    only; `positive="down"` swaps the valence coloring for debt-paydown contexts (color = which direction is good,
    position = in/out identity — two independent channels). Negative inputs are invalid (flows are magnitudes) and
    coerced to 0; the net sign is stated in the label's **text**, never color-alone.

  New `EN_NET_FLOW` summary module (`netFlow`, `netFlowAt`, `netFlowNoFlow`) — the summary and live region always pair
  the net with its gross.

- 425f933: Batch 2 wave 2 — `QuantileDots` (`./quantile-dots`), static + `/interactive` entries:

  - `QuantileDots` — a quantile dotplot: `count` dots (default 20) at equal-probability quantiles (Kay/Fernandes binning
    from `core/quantile`), stacked into columns. Each dot ≈ a 1-in-count chance — NOT a raw observation. With a
    `threshold`, the dots past the line are re-inked accent AND ringed (never color-alone), and the summary uses
    frequency framing ("10 in 20"), never a bare percentage. `count` (capped at 25), `side="above" | "below"`. The
    interactive entry is the probe: hovering / arrowing moves a live threshold and the count past it recomputes purely.

  New `EN_FREQ` keys `quantileDots` / `quantileDotsRange` (shares the frequency-framing module with IconArray). **Audit
  flag (plan/12):** the studied dotplot (Kay 2016 / Fernandes 2018) used 50 dots; the 15–20 default is a micro-scale
  countability judgment, not a validated equivalence.

- 425f933: Batch 2 wave 2 — `RateVolume` (`./rate-volume`), static + `/interactive` entries:

  - `RateVolume` — a precise rate line over deliberately low-precision, zero-anchored ghost volume bars (the
    denominator). There is no prop to remove the bars, and a rate on **zero** volume is never plotted (line gap + zero
    bar) — the lie this type prevents. `minVolume` flags a thin denominator by rendering the rate mark hollow (shape
    cue, survives forced-colors); `curve="linear" | "step"` (no smooth — a rate line must not imply between-period
    values); separate `volumeFormat`. The summary and the interactive live region never state a rate without its volume.

  New `data-mc-ink="ghost"` ink-role (neutral, low-opacity context) in `styles.css` with a forced-colors mapping. New
  `EN_RATE_VOLUME` summary template module (`rateVolume`, `rateVolumeShort`, `rateVolumeAt`, `rateVolumeNoEvents`).

- 425f933: Batch 2 wave 2 — `RetentionCurve` (`./retention-curve`), static + `/interactive` entries:

  - `RetentionCurve` — a **step** line (cohort periods are discrete) on a y-domain **locked to [0,1]** (the full range
    is the honest frame for a share; truncating the floor manufactures drama). Detects and marks a plateau (mean |Δ|
    over the last `max(3, ⌈n/3⌉)` periods < 0.005) with a dotted horizontal; an optional `benchmark` peer curve rides
    behind as a subordinate dashed muted ghost. `curve="smooth"` for editorial contexts (docs note step is the honest
    default); `plateau={false}` for the raw curve. Percent input (max > 1.001) is divided by 100; non-monotone bumps
    (resurrection) render as-is, never sorted or smoothed away.

  New `EN_RETENTION` summary module (`retention`, `retentionNoPlateau`, `retentionAt`).

- 425f933: Batch 2 wave 3 — `ABStrips` (`./ab-strips`), static + `/interactive` entries:

  - `ABStrips` — two graded quantile strips on ONE shared scale (p5–95 outer, p25–75 inner middle half, median dot; row
    A muted, row B accent). The visible overlap of the middle halves is the answer, and the overlap number is always in
    the summary — an average delta without its spread is how A/B results lie. Never a bare mean bar; the delta label
    never appears without the strips behind it. `labels`, `positive` (colors the delta's valence, sign always in text),
    `label="delta" | "none"`. Identical arms → "no clear difference"; disjoint → "clearly separated"; an arm with n < 8
    falls back to a min–max band. The interactive entry roves rows (↑/↓) and quantile edges (←/→).

  New `EN_AB` summary module (`ab`, `abSeparated`, `abNoDiff`, `abRow`, `abEdge`).

- 425f933: Batch 2 wave 3 — `ChangePoint` (`./change-point`), static + `/interactive` entries:

  - `ChangePoint` — when did the behavior change level? Regime shading (neutral identity, not valence) + per-regime mean
    hairlines + the series line + a break marker, so a spike is read against the regime it broke. The detector is a
    **documented heuristic, not statistics**: a two-segment mean-shift via binary segmentation, accepted only when the
    split cuts the pooled sum-of-squares by more than `BREAK_SS_RATIO` (0.2) **and** the mean gap clears
    `BREAK_EFFECT_SIZE` (0.8) × the pooled SD — both are named exports, property-tested (no break on constant /
    low-noise series, exact index on a clean step, never more than `max`). `breaks` (`"auto"` or explicit indices — the
    recommended production path, detection off), `max` (1–3), `means`, `label="delta"`. Gradual ramps are honestly found
    to have no level shift (named limitation → Sparkline). The interactive entry steps points with ←/→ (value + regime)
    and cycles breaks with Tab (each announcing the mean shift).

  New `EN_CHANGE_POINT` summary module (`changePoint`, `changePointNone`, `changePointAt`, `changePointBreak`).

- 425f933: Batch 2 wave 3 — `CyclePlot` (`./cycle-plot`), static + `/interactive` entries:

  - `CyclePlot` — a cycle plot (seasonal-subseries chart): what repeats beneath the trend, and is any slot drifting? The
    series is reshaped row-major into `period` slots; each slot shows its own raw values across cycles as a muted
    polyline **in time order** (never smoothed, never joined across a slot boundary) plus a mean/median tick, and the
    accent spine connects the slot centers — seasonality and drift kept as separate reads. `period` (4–12, required),
    `slots` (names for summaries), `center` (`"mean"`/`"median"`), `trend` (`"line"`/`"none"`), `spine` (off for
    drift-only), `cycleUnit`. Ragged final cycles and per-slot counts are carried honestly; `period ≥ length` drops to a
    spine-only read; nulls are excluded from a slot, never interpolated. The interactive entry steps slots with ←/→
    (mean, cycle count, drift) and individual observations with ↑/↓.

  New `EN_CYCLE` summary module (`cycle`, `cycleNoDrift`, `cycleAt`, `cyclePoint`).

- 425f933: Batch 2 wave 3 — `DataDiff` (`./data-diff`), static + `/interactive` entries:

  - `DataDiff` — what changed between two versions of the data? One diverging bar per key: **removed leftward, added
    rightward, both always drawn** on one symmetric shared scale, so a +500/−480 churn never looks like a +20/−0
    trickle. `labels` (in-chart key tags), `net` (a tick at added−removed — a summary mark, never a stand-in for the two
    bars), `sort` (`"none"` keeps the input order, which is often meaningful), `label="totals"` (a `+added / −removed`
    footer), `domain` (a shared scale for cross-chart comparison). Negative counts are magnitudes → clamped to 0; a 0/0
    key keeps a hairline placeholder tick (absence of change ≠ absence of the key); more than 12 rows warns and steers
    to a table of DataDiffs rather than truncating silently. The interactive entry steps the rows and announces each
    key's added, removed, and net change.

  New `EN_DATA_DIFF` summary module (`dataDiff`, `dataDiffEmpty`, `dataDiffAt`).

- 425f933: Batch 2 wave 3 — `EnsembleGhosts` (`./ensemble-ghosts`), static + `/interactive` entries (the final Batch 2
  chart):

  - `EnsembleGhosts` — what could happen across the simulated futures? A faint bundle of member paths with one
    emphasized representative, because a mean line hides that futures disagree in **shape**, not just endpoint. Ghost
    selection is **deterministic** — members ranked by endpoint value and picked at evenly spaced quantiles of that
    ranking (no `Math.random`, no jitter), so the same input renders identically every time. `ghosts` (default 8, cap
    12), `emphasis` (`"nearest-median"` = a real member closest to the pointwise median / `"median"` = the synthetic
    median, flagged in the summary / a pinned member index), `endpoints` (ghost endpoint dots). Members of unequal
    length each draw to their own length; NaN members are excluded; a single member steers to Sparkline.
  - The interactive entry is **the HOP loop**: on hover/focus it flips through the members one at a time (~400 ms/frame
    ≈ 2.5 Hz), looping until the pointer leaves. Reduced motion turns the loop off — ←/→ step members discretely (the
    same information without motion) — and the live region announces only on a keyboard step or when the loop stops,
    never per frame. A static frame is not a HOP; the loop lives only in the interactive entry.

  New `EN_ENSEMBLE` summary module (`ensemble`, `ensembleSingle`, `ensembleAt`).

- 425f933: Batch 2 wave 3 — `ParetoStrip` (`./pareto-strip`), static + `/interactive` entries:

  - `ParetoStrip` — descending bars + a cumulative-share line on a **fixed 0–100% scale** that spans the full height and
    is never rescaled to steepen the curve. Bars up to the threshold crossing are accent (the vital few); the rest are
    muted — the chart's one job is to say where to stop reading. `threshold` (default 80, a working reference not a law;
    `false` turns it off), `max` (categories beyond it roll up into `Other`, always rendered last and never re-ranked).
    Negatives are excluded (a composition can't be negative); zero total → "No recorded <metric>". The interactive entry
    steps the bars (share + cumulative) and **T** jumps to the crossing.

  New `EN_PARETO` summary module (`pareto`, `paretoTop`, `paretoEmpty`, `paretoAt`).

- 425f933: Batch 2 wave 3 — `QuadrantDot` (`./quadrant-dot`), static + `/interactive` entries:

  - `QuadrantDot` — where does this item sit in the 2×2, against the field? A focal dot placed by 2-D position, a
    hairline cross at the split (default = domain midpoints, always overridable but **never hidden**), a faint tint on
    the focal's quadrant, and tiny muted ghost dots for the peers. The read is quadrant **membership** first, so it
    lives at glyph scale (24×24) with no in-chart text — axis meaning rides on `title` + summary (skipping them is the
    documented anti-pattern). `xDomain`/`domain`, `split`, `field`, `quadrants` (names in reading order, summaries
    only), `xLabel`/`yLabel`, `region` (tint off for dense grids). Boundary rule: ≥ split ⇒ right/top; a degenerate axis
    centers the focal and suppresses that split line. The interactive entry cycles the peers nearest-first with coords +
    quadrant, and a pointer picks the nearest dot.

  New `EN_QUADRANT` summary module (`quadrantName`, `quadrant`, `quadrantLone`, `quadrantAt`) and a
  `data-mc-ink="region"` tint role (accent 5%, drops out under forced-colors).

- 425f933: Batch 2 wave 3 — `ShiftHistogram` (`./shift-histogram`), static + `/interactive` entries:

  - `ShiftHistogram` — mirrored before/after histograms on SHARED bin edges (before up muted, after down accent) with
    the median shift as the takeaway. Bar heights are per-side proportions (each side's counts ÷ its own n) on one
    shared height scale — the only allowed normalization — so unequal sample sizes cannot fake a shift, and the summary
    carries both n's when they differ. The mirror carries identity, not valence (up ≠ good).
    `mode="mirror" | "overlay"`, `bins` (shared, Sturges ≤12). One side empty → single histogram + "no <side> sample";
    no change → "unchanged".

  New `EN_SHIFT` summary module (`shift`, `shiftHeld`, `shiftSamples`, `shiftOneSide`, `shiftBin`). Median computed
  inline (not via `core/quantile`) to keep the histogram bundle under the 3 kB static hard cap. Side tags dropped — they
  collided with the bars at every micro size; position + color + summary carry identity (plan/12).

- 01b6e7f: Batch 3 (expressive) — `BalanceBeam` (`./balance-beam`), static + `/interactive` entries:

  - `BalanceBeam` — which of two sides outweighs, and roughly by how much. A beam tilts toward the heavier side;
    direction is instant and the angle **saturates** at `maxTilt` (read direction + rough magnitude, not an exact ratio
    — docs steer precise ratios to `PairedBars`/`Delta`). The two weights are area-true (half = k·√value). The beam
    endpoints are pre-rotated in geometry (no SVG transform in the static entry, so containment is provable from
    coords). `mode="ratio"` (share-of-whole, default) or `mode="difference"` (absolute, scaled by `domain`);
    `shape="square"|"round"`, `label="values"`. The interactive entry eases the beam to its new tilt (CSS geometry
    transition), reveals a side's value on hover or ←/→, and announces when the heavier side flips.

  New `EN_BEAM` summary module (`balanceBeam`, `balanceBeamBalanced`) + a beam-tilt CSS transition rule. Node budget
  ≤ 6.

- 01b6e7f: Batch 3 (expressive, motion) — `BreathingDot` (`./breathing-dot`), static + `/interactive` entries:

  - `BreathingDot` — how loaded is the system right now, ambiently? The static frame is a real chart with zero JS: a
    core dot colored by threshold band (calm / elevated / strained) plus a level ring whose distance from the core
    encodes the level. The interactive entry adds a WAAPI pulse whose rate and amplitude are snapped to the three bands
    — **motion IS the encoding** (the allowed idle-loop exception, because the loop parameter is the datum).
    `thresholds` (default `[0.5, 0.8]`), `label="value"` (percent numeral escape hatch).
  - **Reduced-motion + viewport gating** — the pulse never runs under `prefers-reduced-motion` (reduced-motion readers
    get exactly the static frame; the ring offset already carries the level) and pauses when the dot scrolls off-screen
    (a shared `IntersectionObserver`). Band color is always doubled (ring offset statically, pulse rate in motion),
    never color-alone.
  - **Honesty** — an unknown value (`null` / `NaN`) makes the dot gray, drops the ring, and never pulses: an unknown
    system must not look calm. The live region announces band changes only, never per tick.

  New `EN_BREATHING_DOT` summary module (`breathingDot` / `breathingDotUnknown` + `loadBands`) and a shared
  `src/shared/motion.ts` (`usePrefersReducedMotion`, `useInViewport` with one shared observer) that the batch's motion
  charts reuse. Node budget 3.

- 01b6e7f: Batch 3 (expressive) — `BubbleRow` (`./bubble-row`), static + `/interactive` entries:

  - `BubbleRow` — roughly how a few magnitudes compare, with physical presence: a row of circles whose **area** (r ∝
    √value) is proportional to value. This is the catalog's honest LOW-precision exemplar — area is the weakest common
    channel, so the LOW rating and the standing **"for precise comparison, use MiniBar"** steer are printed in the
    catalog, `/catalog.json`, and the docs header. Value numerals are ON by default (`label="value"`), because a
    low-precision channel owes the reader the number; `both` adds the category label, `none` opts out. `align="center"`
    (specimen row, default) or `"baseline"` (weights on a shelf). No sorting prop — order = data order (reordering is
    the caller's statement). Zero renders a small presence ring. The interactive entry roves bubbles with ←/→ (or
    hover), announcing each one's exact value.

  New `EN_BUBBLE` summary module (`bubbleRow`, `bubbleAt`). Node budget 2 per bubble.

- 01b6e7f: Batch 3 (expressive) — `CitySkyline` (`./city-skyline`), static + `/interactive` entries:

  - `CitySkyline` — how groups compare on size and how activated each is, two variables in one row. Building **height**
    is the primary, zero-anchored, high-precision channel (like a MiniBar); the **lit-window fraction** is a secondary
    low-precision channel ("mostly lit / half lit / dark", not a number). Windows are a fixed 2 columns, filled
    bottom-up, quantized to the window count. Omit `lit` everywhere → a plain bar row. NO roofline/antenna/width
    variation — width, roof, and ground are constants (earn every mark). The secondary channel drops out before the
    primary: a tower too short for a window row is solid, and its `lit` still shows in the summary and on hover.
    `labels`, `ground`, `label="value"`. The interactive entry roves buildings with ←/→, announcing each as "Platform:
    46; 70% lit."

  New `EN_SKYLINE` summary module (`citySkyline`, `citySkylineAt`, `citySkylineAtLit`). Node budget 2 per building + 1
  (merged windows path per building).

- 01b6e7f: Batch 3 (expressive, motion) — `CometTrail` (`./comet-trail`), static + `/interactive` entries:

  - `CometTrail` — where is the value now, and where has it just been? The static frame is a decaying dot-sparkline with
    zero JS: a fading trail of recent points + a bright head dot at the current value + the now-value numeral. The
    interactive entry eases the head to each new value (WAAPI transform, ~220 ms) and decays the old head into the trail
    — motion only on data change, no idle loop. `trail` (points kept visible, default 12, cap 20), `label="last"`
    (default).
  - **Honesty** — opacity encodes AGE only, never value (the y position does value); `trail` length is recency context,
    so changing it never changes the head read. The dot jumps to truth, eased — never interpolated between updates (a
    stalled stream goes still, which is the signal). Reduced motion → instant reposition (the static encoding is already
    complete); off-viewport paused.
  - Arrow-Left steps back through the trail ("3 updates ago: 74."), Arrow-Right returns toward now, each announced
    through a polite live region.

  New `EN_COMET_TRAIL` summary module (`cometTrail` / `cometTrailNow` / `cometTrailAt` + `cometTrends` trend words).
  Node budget ≤ trail + 2.

- 01b6e7f: Batch 3 (expressive) — `Constellation` (`./constellation`), static + `/interactive` entries:

  - `Constellation` — when the rare events happened, and how big. Each event is a dot placed by time (x) and value (y);
    an optional magnitude drives an **area-true** dot size (`r ∝ √m`). A hairline chronology line connects the events in
    time order. Built for _rare_ events (a dozen or fewer); dense streams steer to `Seismogram` / `EventTimeline`.
    `connect` (default `true`; off for a pure scatter), `label="max"` (numeral beside the largest event), `xFormat`
    (formats time for the summary — e.g. a month name), `domain` / `xDomain`.
  - **Honesty** — dot size is area-true, a deliberately low-precision channel, so the number lives in the summary and
    the hover readout, never in a size you must measure. When no event carries a value, the vertical position is
    **deterministic seeded jitter that encodes nothing** (SSR/hydration-stable via `core/jitter`); the connector's slope
    is then meaningless and the summary never reads vertical position. Time is sacred — the x position is never
    jittered, so simultaneous events share an x.
  - The interactive entry steps through the events chronologically (←/→), announcing each event's time, value, and
    magnitude through a polite live region, with a matching hover readout and a focus ring on the active event.

  New `EN_CONSTELLATION` summary module (`constellation` / `constellationOne` / `constellationAt`). Node budget n+1.

- 01b6e7f: Batch 3 (expressive) — `DicePips` (`./dice-pips`), static + `/interactive` entries:

  - `DicePips` — a small count or severity read instantly as a canonical die face, subitized rather than counted. Only
    the real 1–6 pip patterns exist; `0` is an empty face (zero, not missing), and any value `> 6` renders the exact
    numeral in the face instead of inventing a seven-pip layout — the documented honesty fallback. `face={false}` drops
    the outline for dense table columns. The interactive entry cross-fades the pip set on change and announces the new
    face through a polite region; the pips are one value, so there is no cursor to move.

  New `EN_DICE` summary module (`dicePips`, `dicePipsOver`). Node budget ≤ 7 (face + up to six pips).

- 01b6e7f: Batch 3 (expressive) — `FatDigits` (`./fat-digits`), static + `/interactive` entries:

  - `FatDigits` — the numeral is the exact value; font _weight_ is a redundant, preattentive tier (5 or 3 ordinal steps
    mapped from `domain`) so big numbers pop as you scan a dense column. Weight is never the primary read — it is
    ordinal and coarse, and the number is right there. `encode="value"` weights the whole numeral; `encode="digit"`
    weights each digit by its own magnitude. `tiers={3|5}`. Always pass a `domain` (a lone number renders at the middle
    weight, documented). The interactive entry eases the weight to its new tier on variable fonts (snaps otherwise) with
    no layout shift, and announces value + tier through a polite region.

  New `EN_FAT` summary module (`fatDigits`, `fatDigitsPlain`) + one motion-layer CSS rule for the weight transition
  (tspans are inside `.mc-root`, so the reduced-motion block gates it). **Deviation from FatFonts (plan/12):** the
  source encodes magnitude as glyph ink _area_ via a custom font; shipping a font would break zero-dep (non-negotiable
  #1), so we map to discrete `font-weight` tiers on the inherited font — ordinal, never continuous; the numeral is
  always exact. Static budget 1.6 kB (the cached `makeFormatter` for grouped numerals is needed) — above the 1.5 kB
  Delta-class target but well under the 3 kB hard cap; logged for the batch gate.

- 01b6e7f: Batch 3 (expressive) — `FillWord` (`./fill-word`), static + `/interactive` entries:

  - `FillWord` — the label IS the bar: a muted word overlaid with an accent copy of itself, clipped (CSS
    `clip-path: inset()` — no `<clipPath>` element, so no generated id) to the value fraction of the word's OWN inked
    extent, so 50% visually bisects the word and the fill is never of a hidden wider track. Glyph extent is estimated
    deterministically (0.62 em/char) and pinned with `textLength`
    - `lengthAdjust`, so containment is provable server-side without measuring text. `mode="fill"|"drain"` (drain
      empties from the left for a remaining-time / TTL story), `label="value"` appends the percent. The interactive
      entry glides the ink edge with a reduced-motion-gated clip-path transition and announces changes through a polite
      region, throttled to ≥1 s.

  New `EN_FILL_WORD` summary module (`fillWord`, `fillWordRemaining`) + one motion-layer CSS rule for the clip-path
  transition (the accent copy is inside `.mc-root`, so the existing reduced-motion block gates it). Node budget 2 (+1
  numeral).

- 01b6e7f: Batch 3 (expressive) — `GardenGrid` (`./garden-grid`), static + `/interactive` entries:

  - `GardenGrid` — ActivityGrid's grayscale sibling: it encodes a calendar-shaped activity rhythm as quantized dot
    **area** (single ink) instead of color, so it survives print and monochrome. The radius is √-quantized
    (`r = rMax·√(k/S)`) so perceived area steps evenly — a linear radius map would exaggerate the highs quadratically. A
    zero cell is a hairline **ring** (present, quiet); a `null` cell is nothing (missing ≠ zero). `rows` (default 7; `1`
    = strip), `steps={3|5}`, `empty="ring"|"blank"`. The interactive entry walks the grid in 2-D with the arrow keys (or
    hover), announcing each cell's ordinal **step** — "3 of 12: 8, step 2 of 5." — never a false-precise value.

  New `EN_GARDEN` summary module (`gardenGrid`, `gardenCell`). Node budget 1 per cell (cap 400, dev-warned).

- 01b6e7f: Batch 3 (expressive, motion) — `HeartbeatBlip` (`./heartbeat-blip`), static + `/interactive` entries:

  - `HeartbeatBlip` — is it alive, and how busy? A baseline with an ECG-style spike at each event across the recent
    window (x = how long ago). The static frame shows the spike positions with zero JS; the interactive entry sweeps the
    trace left in real time so the blip frequency IS the event rate. `window` (default 60000 ms), `now` (explicit clock
    — pass from the data layer; the static entry never calls `Date.now()`, so SSR stays deterministic), `label="count"`.
  - **Honesty (the load-bearing rule)** — every spike is ONE real event; nothing is synthesized on a timer. An empty
    window → a flat baseline that IS the down signal (shape, never color), with a "no events" state distinct from
    no-data. Events after `now` are clamped (clock skew); events older than the window drop.
  - **Reduced-motion + viewport gating** — the sweep pauses off-screen (shared observer) and never runs under
    `prefers-reduced-motion` (the static strip re-renders on each data change instead — same information). A new event
    blips the endpoint once (WAAPI scale) and announces through a polite live region; there is no per-spike navigation
    (spikes are transient — the summary is the record).

  New `EN_HEARTBEAT` summary module (`heartbeat` / `heartbeatFlat` + translatable `heartbeatWindow` / `heartbeatAgo`
  duration helpers). Node budget 3.

- 01b6e7f: Batch 3 (expressive) — `Honeycomb` (`./honeycomb`), static + `/interactive` entries:

  - `Honeycomb` — how many of the available slots are taken, as filled cells in an area-filling hex grid. The unit is
    the cell, so the count is genuinely countable (total ≤ 60 — above that unit counting stops being countable and the
    chart steers to `Progress`; refusing is the feature). Pointy-top hexes, odd-row offset, near- square by default,
    filled row-major from the top-left so occupancy reads as a sweep. The whole grid is exactly **two `<path>` nodes**
    (filled + empty) regardless of total. `total` (capacity), `rows` (number or `auto`; `1` = strip),
    `empty="outline"|"dim"`. A value past the total fills every cell but the accessible name still states the true
    number — occupancy is never silently clipped. The interactive entry announces the count on change and reveals
    value/total on hover; cells are anonymous units, so there is no per-cell cursor.

  New `EN_HONEYCOMB` summary module (`honeycomb`). Own hex math (`hexPath` + axial→pixel), chart-local. Node budget 2.

- 01b6e7f: Batch 3 (expressive) — `Hourglass` (`./hourglass`), static + `/interactive` entries:

  - `Hourglass` — how much time is gone AND how much remains, the two-sided story a progress bar can't tell. Sand fills
    the top chamber (remaining) and the bottom (elapsed), both **area-true**: a naive linear-height fill in a triangular
    bulb would overstate early progress by up to 2×, so the geometry uses closed forms (top: remaining `r` fills from
    the apex to `H·√r`; bottom: elapsed `e` fills from the base to `H·(1−√(1−e))`) — sand areas are exactly proportional
    (lie factor 1). `value` is the elapsed fraction (same polarity as `Progress`). A thin neck stream is a binary
    "running" state mark, rendered only while `0 < value < 1` (finished and not-started are shape-distinct). `stream`
    toggle, `label="remaining"|"elapsed"`. The interactive entry cross-fades the sand levels and announces only at
    documented thresholds (50/90/100%).

  New `EN_HOURGLASS` summary module (`hourglass`). Node budget 4. No `makeFormatter` (percents computed inline).

- 01b6e7f: Batch 3 (expressive) — `MoonPhase` (`./moon-phase`), static + `/interactive` entries:

  - `MoonPhase` — the illuminated area of a disc encodes a 0–1 fraction, area-true and readable across cultures. The lit
    **area equals the value exactly** via a closed-form terminator (a semi-ellipse with `rx = r·|2f−1|`; lit area =
    right semicircle ± semi-ellipse = `f·πr²`), never the phase-angle approximation that under-lights mid-cycle.
    `mode="progress"` is monotonic (0 new → 0.5 half → 1 full — the sprint/ quota story); `mode="cycle"` maps the real
    lunar sequence (0 new → 0.5 full → 1 new, waxing then waning) — a data-semantic switch, never a preset. Waxing
    lights from the right. The interactive entry cross-fades the lit region on change (an opacity swap, never a `d:`
    path interpolation — no Safari), reveals the percent on hover/focus, and announces through a polite region.

  New `EN_MOON` summary module (`moonPhase`, `moonPhaseCycle`). Node budget 3 (disc + lit region + outline). No
  `makeFormatter` — the percent is computed inline.

- 01b6e7f: Batch 3 (expressive) — `MusicStaff` (`./music-staff`), static + `/interactive` entries:

  - `MusicStaff` — the shape of a short series read as a melody: each value is a note, its **pitch** (vertical position
    on a five-line staff, quantized to line/space positions) is the value, and left-to-right is time. Pitch is the ONLY
    channel — no clefs, stems, beams, or bar lines (every other notation convention would be decoration).
    `range="ledger"` (default, ±2 ledger positions with hairline ticks) or `range="staff"` (clamp on-staff for dense
    cells); `label="last"` prints the final value. Two adjacent equal values are spaced along the time axis, never
    dodged vertically (that would change pitch = the data). The interactive entry steps notes with ←/→.

  Reuses `describeSeries` verbatim for the accessible name (same S1 pipeline as Sparkline — no new summary template).
  Static budget 2.32 kB (the describeSeries / seriesStats machinery) — above the spec's 2 kB target, under the 3 kB hard
  cap; logged. Node budget n + 2.

- 01b6e7f: Batch 3 (expressive, motion) — `OrbitStatus` (`./orbit-status`), static + `/interactive` entries. **Completes
  the 22-chart Batch 3 (expressive) catalog.**

  - `OrbitStatus` — how slow and how busy is this dependency right now? A service dot with an orbit whose RADIUS =
    latency and whose DASH DENSITY = call rate (quantized to 5 steps, "denser dashes = more calls") + a satellite. The
    static frame carries BOTH variables with zero JS; the interactive entry mirrors the rate as the satellite's angular
    SPEED (the same 5 steps, so static and motion decode identically) — **motion IS the encoding** (idle-loop exception,
    loop rate = the datum). `latencyDomain` / `rateDomain` (insisted on — a lone radius is meaningless), `alert`
    (latency threshold: satellite doubles + summary flags), `label="latency"` (ms numeral escape hatch).
  - **Honesty** — both channels are quantized 5-step ordinals; radius and speed come from the same domains in both
    frames (no drift). The satellite's angular POSITION encodes nothing — only its speed does (documented). `rate` 0 → a
    solid, dash-free orbit; unknown latency/rate → gray, no satellite, and no spin (an unknown dependency must not look
    healthy). The alert state is doubled by the satellite size + the summary, never color-alone.
  - Reduced-motion → the static frame (dash density already carries rate); off-viewport paused (shared observer); the
    live region announces threshold crossings only.

  New `EN_ORBIT_STATUS` summary module (`orbitStatus` / `orbitAlert` / `orbitUnknown`, units in-template). Built on
  `core/arc` (`evenDashes` / `polarPoint`). Node budget 3.

- 01b6e7f: Batch 3 (expressive) — `PolarClock` (`./polar-clock`), static + `/interactive` entries:

  - `PolarClock` — the shape of a day or week cycle: when is it busy? Each value in a cyclic series is a radial bar at
    its fixed cycle angle, growing outward from an inner baseline (length ∝ value). 0 sits at 12 o'clock and the cycle
    runs clockwise. Works for any n (24 hourly, 7 daily, or arbitrary). `now` accents the current segment (position +
    color, never color alone), `start` rotates which index sits at 12 o'clock, `labels` adds hairline cardinal ticks,
    `label="max"` prints the peak value in a gutter, `formatSegment` labels segments (hour formatting for n=24, weekday
    names for n=7).
  - **`mode="opacity"`** switches the channel to fixed-length sectors whose 5-step fill carries the value — a radial
    `ActivityGrid` for very small sizes — a deliberate, documented change of encoding.
  - **Honesty** — the channel is radial LENGTH from the inner baseline, never sector area; a nonzero inner radius curbs
    the outer-area distortion and the docs ask you to compare lengths, not wedges. Bars are always zero-anchored; a
    `null` segment leaves a gap (missing ≠ zero).
  - The interactive entry maps the cursor angle to a segment (lifting it to the accent), arrows through segments
    circularly, and announces each segment's label and value through a polite live region with a matching hover readout.

  New `EN_POLAR_CLOCK` summary module (`polarClock` / `polarClockFlat` / `polarClockAt` + `weekdays` i18n array). Built
  on `core/arc` (`annulusSector`). Node budget 3.

- 01b6e7f: Batch 3 (expressive) — `SpiralYear` (`./spiral-year`), static + `/interactive` entries:

  - `SpiralYear` — how did the year breathe? A calendar series wound onto an Archimedean spiral: angle = position in the
    year (Jan at 12 o'clock, clockwise), each turn outward = the next year. The value is a 5-step (or 3-step) opacity —
    an ordinal channel — so this is a PATTERN instrument, and the docs steer exact reads to `ActivityGrid`/`HeatStrip`.
    `cadence` (day/week, inferred from length), `startDate` (anchors index 0 to a calendar angle), `steps={3|5}`,
    `monthTicks` (12 faint radial ticks, default on), `mark="dot"|"arc"`.
  - **Honesty** — the spiral RADIUS encodes time only, never value; an outer mark is a later date, not a bigger number.
    Opacity is 5-step-quantized and ordinal. A `null` leaves a gap in the spiral (missing ≠ a step-one mark). Marks are
    grouped by opacity step into ≤ `steps` merged `<path>` nodes, so the node count is O(steps), not O(days).
  - The interactive entry finds the nearest mark by 2-D distance, arrows along the spiral chronologically, and announces
    each period and value through a polite live region with a matching hover readout.

  New `EN_SPIRAL_YEAR` summary module (`spiralYear` / `spiralYearAt`). Built on `core/arc` (arc marks) +
  `core/calendar-grid` (`dayOfYear`, `monthStartDays`). Node budget ≤ 7.

- 01b6e7f: Batch 3 (expressive) — `SproutRow` (`./sprout-row`), static + `/interactive` entries:

  - `SproutRow` — how mature or healthy each item in a small set is, as an ordinal growth-stage glyph (seed → sprout →
    leaf → bloom). Glyph height is **strictly monotonic** with stage, so taller always reads as further along and the
    ordering survives without the key; the four stages are discrete with no interpolated half-stages (a growth metaphor
    must not fake continuity). Each item is one filled path (thin stem + leaves/head), scaled to the usable height. A
    `null` value is a real gap — it draws only the soil tick, distinct from a seed. `labels` (category labels under the
    slots) and `label="value"` (stage number above each glyph). The interactive entry roves items with ←/→ (or hover),
    announcing each as "Acme: bloom, stage 4 of 4." with a focus ring.

  New `EN_SPROUT` summary module (`sproutRow`, `sproutStage`, `sproutStageNames`, `sproutEmpty` — the four stage names
  carry the i18n contract). Node budget n + 1.

- 01b6e7f: Batch 3 (expressive) — `TallyMarks` (`./tally-marks`), static + `/interactive` entries:

  - `TallyMarks` — counts the way a human counts: four-and-strike clusters of five, then the remainder, all in ONE
    merged stroke path (node budget 2 with the overflow numeral). The count reads back exactly up to `max`; past it the
    marks stop growing and a `+N` numeral tells the truth, so a cell never blows out its width — marks are never resized
    to fit. `pen="ruled" | "drawn"` (seeded, SSR-stable jitter for the editorial voice — perturbs stroke rendering only,
    never the count) and `overflow="numeral" | "clamp"` (clamp drops the numeral; the accessible name still carries the
    true count). The interactive entry announces the new total through a polite region and draws newly added marks in
    with a brief, reduced-motion-gated stroke-dashoffset sweep; a count has no sub-parts, so focus reads the summary and
    there is no cursor to move.

  New `EN_TALLY` summary module (`tally`). Naming note: the spec named the pen variant `style`, but every chart already
  exposes `style?: CSSProperties`; the knob ships as `pen` to keep that passthrough intact (recorded in plan/12).

- 01b6e7f: Batch 3 (expressive) — `Thermometer` (`./thermometer`), static + `/interactive` entries:

  - `Thermometer` — where a value sits on a calibrated ticked tube, and how close to a goal. The fill anchors at
    `domain[0]` (never re-zeroed, never log — the ticks calibrate the read, which is what buys the high precision); the
    fill rect width equals the tube inner width so no clipPath/id is needed. An optional `target` draws a line across
    the tube (distinct shape from the side ticks, never color-alone). The bulb is instrument chrome (always full), never
    data. `orientation="vertical" |"horizontal"`, `bulb`, `ticks` (count or explicit values), `label="value"`, `domain`
    (default `[0,100]` — a stated range, never auto-fit). A value beyond the domain clamps the fill but the accessible
    name reports the true number. The interactive entry reveals the value on hover/focus and glides the fill with a
    reduced-motion-gated transition.

  New `EN_THERMOMETER` module (`thermometer`, `thermometerTarget`) + a fill-transition CSS rule. Static 2.22 kB (needs
  `makeFormatter` + `scaleLinear`) — above the spec's 2 kB target, well under the 3 kB hard cap; logged for the batch
  gate.

- 01b6e7f: Batch 3 (expressive) — `TreeRings` (`./tree-rings`), static + `/interactive` entries:

  - `TreeRings` — how growth accumulated period over period, like the rings of a tree: oldest at the centre, each new
    period adds a ring outward whose **thickness** is that period's value. The channel is radial thickness, NOT area
    (equal thickness at a larger radius spans more area — the ring illusion; the docs say "compare thicknesses"). No
    minimum visual thickness — a near-zero period looks near-zero, and a zero-value period collapses its boundaries.
    `accent="last"|"none"|index` emphasizes a boundary (1.5× weight + accent color, never color alone); `total` scales
    the disc to Σdata/total of the radius (the cohort-age story); `rings="stroke"|"fill"`; `label="last"`. The
    interactive entry steps rings from the centre out with ←/→ (radial pointer lookup).

  New `EN_TREE` summary module (`treeRings`, `treeRingAt`). The full-annulus path is inlined (evenodd fill) rather than
  importing `core/arc`, keeping the static entry at 1.78 kB. **Naming note (plan/12):** the spec's `style` render
  variant collides with the universal `style?: CSSProperties`, so it ships as `rings`. Node budget n + 1.
