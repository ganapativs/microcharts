---
"@microcharts/react": patch
---

Data ink now holds its stroke weight at any render scale, catalog-wide.

Charts used to spell `vector-effect: non-scaling-stroke` per mark, and 39 of the 106 missed at least one. Fourteen of
those pinned some marks and not others, so a single chart could hold a hairline on its data line while its own baseline
thickened. Because every interactive entry spreads `width: 100%`, a chart in a wide container rendered its ink up to 15×
heavier than the same ink in a narrow one, which is why the gallery read as some charts thin and some thick.

The pin moves into `styles.css`, keyed on where the stroke width comes from: a stroke sized from `--mc-sw` is ink and
holds its weight, and a stroke sized from viewBox geometry stays geometry. A MicroDonut wedge and a ProgressRing arc are
drawn as a stroke, so their band still grows with the box.

No API change. Removing 228 now-redundant attributes shrinks 142 subpaths, 2.7 kB of gzip across the catalog.
