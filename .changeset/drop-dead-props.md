---
"@microcharts/react": minor
---

**Breaking (pre-1.0 API freeze): remove props that were declared but never read.** Each of these was accepted by the
type signature and documented, but had no effect on rendering, geometry, or the accessible summary — passing one did
nothing. They are gone rather than fixed where the chart had no number and no announcement to apply them to.

Removed outright:

- `DualSparkline` — `compareLabel`. Never reached the summary or any announcement; the compare series is described
  positionally.
- `DualWindowMeter` — `damping`. Documented as "ballistics for the live entry", but the interactive entry never read it;
  its motion comes from the shared entrance engine.

Narrowed to the interactive entry only (still available on `…/interactive`, removed from the static default export,
where they did nothing):

- `PercentileTrace` — `unit`. Names the reading in the hover/focus announcement; the static entry announces percentiles,
  not individual readings.
- `CalendarStrip`, `EventRaster`, `MicroScatter`, `TokenConfidence` — `locale` (and `format` on the latter three). These
  statics render lane names, marks and text, never a formatted number; only the readout does.

Wired up instead of removed:

- `ConfusionGrid` — `format` / `locale` now reach the accuracy gutter label, which previously hard-coded
  `Math.round(v * 100) + "%"`. Percent formatting goes through the shared cached `makeFormatter`, so the one number this
  chart renders is locale-aware and honors a custom `format`. Default output is unchanged. The right-hand gutter is
  measured from the produced string, so a locale that widens the label still fits inside the viewBox.
