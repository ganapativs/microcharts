---
"@microcharts/react": patch
---

Stroke weight is now a token everywhere, at every render scale.

**Ink holds its weight.** Charts spelled `vector-effect: non-scaling-stroke` per mark and 39 of the 106 missed at least
one, 14 of them on some marks but not others. The same ink rendered up to 15× heavier in a wide container than a narrow
one. The pin moves into `styles.css`, keyed on where the stroke width comes from: sized from `--mc-sw` it is ink and
holds; sized from viewBox geometry it stays geometry, so a MicroDonut wedge and a ProgressRing arc still grow with the
box.

**Every stroke reaches `prefers-contrast` and `--mc-density`.** Sixteen widths were bare numbers, so they stayed
hairline for a reader who asked the OS for heavier contrast while every stroke around them thickened. Seven were inert,
and the rest now come from the ramp or, for the reference hairlines that are deliberately density-exempt, from
`--mc-stroke-width`.

**The width ramp has a top end.** `data-mc-w` gains `heavy` (4/3) and `anchor` (3/2), which is where the seventeen
inline `calc()` multipliers actually clustered. Fifteen moved onto it, so a preset now retunes the emphasis marks with
everything else. Two literals remain and say why.

**Square-cornered marks rasterize on the pixel grid.** `crispEdges` moves to `rect:not([rx])`, covering all 148 square
rects rather than the 133 that remembered the attribute. Rounded corners keep their anti-aliasing.

**`--mc-duration` reaches entrance motion.** It scales the per-motion durations rather than replacing them, so the
tuning between them survives.

**EtaBar draws its label at its default size.** A `height < 9` gate put it one unit out of reach of EtaBar's own 80×8
box, so the prop was accepted and did nothing.

No API change. The catalog is 4 kB of gzip smaller across 163 subpaths.
