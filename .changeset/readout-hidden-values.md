---
"@microcharts/react": minor
---

**Interactive readouts stop hiding values.** A readout that drops a number is a bug even when it fits, and a dozen
charts were dropping numbers to stay inside the chip width gate. If you read your charts by hovering them, you will see
more than you did before; nothing about the marks, the geometry or the static entries changed.

**Fixed: values that appeared nowhere in the UI.**

- `StackedArea` showed only the leading band, so a three-series stack never named its other two — on a Mobile/Web/API
  traffic mix, the string "API" was unreachable at every column. The chip now lists every band.
- `ConfusionGrid` showed a row-normalised percentage while `count` — the data you pass in — appeared in no chip, no
  announcement and no label. Both now carry it.
- `PartitionStrip`, `LikertStrip` and `VolumeProfile` each showed a derived share while the caller's own `value` (node
  value, per-level count, raw mass) was unreachable. All three now lead with the value and follow with the share.

Four of those five hid the value from assistive technology too, so the announcements gained it alongside the chip.

**Fixed: values you could not attribute.** `ActivityGrid`, `CohortTriangle`, `HeatStrip` and `BumpStrip` printed a bare
number with nothing saying which cell, date or period it belonged to. `CohortTriangle`'s live region already announced
the cohort and age — its chip was strictly poorer than the announcement beside it.

**Fixed: values that were distorted.**

- `Seismogram` rendered a genuine `0` as an em dash, indistinguishable from missing data, in both the chip and the
  announcement. Zero is now a value; only non-finite readings dash out.
- `Waveform` dropped the sign through `Math.abs`, so a trough read as a peak.

**Behaviour changes worth knowing about.**

- Chips that carry more than one fact now render as rows (swatch, name, value) rather than one long line. Chip width is
  set by the widest row instead of by the number of series, so a three-band stack is no wider than a one-band one.
- Readout text is longer than it was. `readout={false}` still turns the chip off entirely, and `onActive` / `onSelect`
  still receive `formatted` if you would rather render the value yourself.
- `SummaryStrings` gained trailing parameters on `confusionAt`, `partitionAt`, `likertAt` and `volumeAt`, plus a new
  `orbitLatency` token. Custom string packs keep compiling — extra arguments are ignored by narrower implementations —
  but a pack that does not use the new parameters will keep announcing the old, lossy sentence. Update those four
  templates to surface the value.
- Percentages in `SegmentedBar`, `PartitionStrip`, `MicroDonut` and `VolumeProfile` now go through the locale's number
  formatter instead of a hand-rolled `%`, so locales that space the sign (`fr-FR` writes `12 %`) render correctly. Unit
  text in `OrbitStatus` moved out of the component and into the string pack.

**Guard.** The suite had a one-directional gate: it failed a chip that was too long, and nothing failed a chip that had
quietly dropped a number. `readout-value-visibility` is the inverse — every fact the geometry knows must be reachable
from the chip or the live region — so a future terseness fix cannot reopen this.

Three interactive entries grow slightly for the row markup. Every static budget is unchanged; no static entry paints a
readout.
