---
"@microcharts/react": minor
---

**Robustness, consistency and legibility pass across all 106 charts.** Most of this is invisible if your charts already
looked right; the parts that aren't are listed under "behaviour changes" below.

**Fixed: charts that could hang, crash or vanish.** These were all reachable from ordinary props, and each now has a
regression test.

- `TapeGauge` never finished rendering when `value` was large enough (about 1e16 and up) that its tick step fell below
  one ULP — the tick loop stopped advancing and spun until the tab died. Ticks are now counted, not accumulated, and
  capped.
- `TraceFold` hung forever on a `parent` graph containing a cycle (a span parented to itself, or any two-span loop). The
  critical-path walk now tracks what it has visited.
- Marks silently disappeared whenever a scale's domain span was infinite — including finite data whose arithmetic
  overflows, such as a `Waterfall` running total past 1e308. An infinite span yields a slope of exactly `0`, which
  passed the old finite check and then produced `NaN` coordinates. `scaleLinear` now validates the span itself.
- `PictogramRow`'s `total`, `Progress`'s `segments`, `Thermometer`'s `ticks` and `FoldedDayBand`'s `bins` allocated one
  node per unit with no ceiling, so a raw count passed by mistake could exhaust memory. All four now saturate.
- Charts derived bounds with `Math.max(...array)`, which throws `RangeError` past roughly 125k elements. Every such site
  now uses a stack-safe fold, so a long series renders instead of crashing.
- `CyclePlot` threw on `period={NaN}` (an empty input field yields exactly that), `HeartbeatBlip` divided by a zero or
  non-finite `window` and could put "in the last NaN minutes" into its accessible name, and `ActivityGrid` accepted an
  unvalidated `domain` and painted `fill-opacity="NaN"`.

**Fixed: accessibility and inline seating.**

- Labels sitting on a solid mark (`HeatCell`'s upper steps, `TimeInRange` zones, `EventTimeline` spans) were rendering
  in body ink instead of on-fill ink — dark-on-dark on the strongest cells. The stylesheet always won over the `fill`
  attribute these charts were setting, so the intended colour never applied.
- A decorative interactive chart (`summary={false}` or `live={false}`) lost its inline baseline seat, which also
  detached its readout chip and hit box from the mark by up to a seat's height. The live region — which carries the seat
  — now stays mounted and is silenced by emptying it.
- Visible readout chips and idle labels on `MicroDonut`, `GradeProfile`, `GardenGrid`, `QuantileDots` and
  `EventTimeline` composed English inline instead of going through the `strings` contract, so they stayed English in a
  localized app.

**Behaviour changes worth knowing.**

- Interactive charts now claim only the horizontal touch gesture (`touch-action: pan-y pinch-zoom`) rather than all
  gestures, so a chart no longer traps the page scroll under a finger; a scroll that takes over now clears the
  highlight.
- `HeatCell` and `HeatStrip` build their step colour by mixing the accent into the band rather than ramping opacity, so
  the steps stay distinct on dark surfaces. The fill moved to the stylesheet, which restores the high-contrast
  (`forced-colors`) mapping that an inline fill was overriding.
- `DotPlot`, `Dumbbell` and `Slope` scale their label type and row-name budget with the chart's size instead of using a
  fixed 6-unit font and 6-character cap, so figure-scale charts read properly. `Slope` steps its type down until the
  labels fit rather than dropping them.

**Added.**

- `strings` on the static `Sparkline`, `SparkBar` and `MusicStaff`. Their generated accessible name was English-only
  with no override short of writing the whole `summary` yourself.
- `labelAt` on `StackedArea`, so endpoint share labels can track a scrubbed column.

**Breaking (pre-1.0), types only.** `SummaryStrings` gained `quantileDotsChip`, `quantileDotsOdds` and
`timelineFallback`. If you supply your own strings object for `QuantileDots` or `EventTimeline`, add those three
templates; every other consumer is unaffected.
