---
"@microcharts/react": minor
---

`curve="smooth"` no longer paints values the data does not contain.

The smooth interpolation was uniform Catmull-Rom, which overshoots: a series dipping back to zero bowed past it, and
with `fill` the area crossed the baseline it is anchored to — 1.33 viewBox units on a 20-unit-tall spark, 6.7% of the
plot. It now uses monotone cubic (Fritsch–Carlson) tangents, so a smoothed run stays inside the range its own points
span. Affects `Sparkline`, `DualSparkline`, `StackedArea`, `RetentionCurve`, `BurnChart`, `HistogramStrip` and
`CyclePlot`; those seven subpaths grow by 8–129 B gzip.

Also in this pass, per chart:

- **Waterfall** — the step connectors are one path instead of one `<line>` per gap: a 100-step waterfall ships 13.2 kB
  of SSR markup across 107 nodes instead of 26.5 kB across 206. A non-finite `open` no longer reaches the accessible
  name ("From NaN to NaN"), and the domain scan no longer spreads the level array into `Math.min`/`Math.max`.
- **ForecastCone** — the uncertainty bands paint through `--mc-cone-color` / `--mc-cone-opacity` instead of inline
  `fill`, so they are themable and, in High Contrast Mode, visible at all; they previously carried a `mc-cone-band`
  class that no rule matched.
- **ErrorBudget** — a non-finite `window` no longer reaches the accessible name; the exhaustion cross is one path; the
  remaining-budget readout carries `data-mc-ink="label"`, so the entrance casts it with the other voice marks.
- **Thermometer** — a non-finite `domain` bound falls back to the documented default in both the geometry and the
  summary, instead of announcing "on a NaN–100 scale" beside a normally drawn tube.
- **TallyMarks** — `total={NaN}` drew no marks and printed no overflow numeral while the summary still read the true
  count; it now falls back to the mark cap.
- **ConfusionGrid** — axis initials take a code point, so a label starting with an astral character no longer renders
  half a surrogate pair.
- **EtaBar** — the unrun track uses the same `data-mc-ink="band"` role `Progress` uses, which also gives it a
  forced-colors mapping.

Direct value labels (`text[data-mc-ink="label"]`) now map to `CanvasText` under `forced-colors: active`. They painted a
fixed `--mc-neutral` gray against the user's chosen background, which is 3.5:1 on a white Canvas.
