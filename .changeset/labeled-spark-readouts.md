---
"@microcharts/react": minor
---

`SparkBar`'s interactive entry takes a `labels` prop, so the hover readout can name the period it shows instead of only
its value: `<SparkBar data={mrr} labels={months} />` reads "Aug 2026 · 1.1K" in the chip and announces "Aug 2026. Point
3 of 12: 1.1K." The name also arrives on `onActive` / `onSelect` as `MicroDatum.label`. Hosts previously had to set
`readout={false}` and rebuild the chip themselves to show a period.

`labels` is indexed like the data. A hole or an empty string leaves that unit on the positional wording, and the two
joins are localizable through the new `named` / `namedChip` string templates.

Also fixes a geometry-parity bug in `Sparkline`'s interactive entry: it reserved the `label="last"` gutter whenever a
label existed, skipping the height check the static entry applies, so on a short chart the two computed different plot
boxes and the crosshair drifted off the painted line.
