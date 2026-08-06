---
"@microcharts/react": minor
---

Five charts now use the box they are given, without changing what a mark means.

**OrbitStatus reads against a stated reference.** The default latency domain was `[0, 2 × latency]` and the default rate
domain `[0, 2 × rate]`, so every input landed at exactly half the radius range and in the middle dash step: the glyph
drew the same circle for a 40 ms service and a 4 s one, and only the summary carried the number. The radius now spans
0–1000 ms, or 0–2× `threshold` when you set one, which puts the alert edge on the halfway orbit. Dash density steps by
decade: under 1 call/s, then 1, 10, 100, and 1000 or more. `domain` is accepted as the grammar-standard spelling of
`latencyDomain`.

**BumpStrip plots the ranks the series holds.** Rank 1 was a hard top anchor, so a run that never placed better than #4
spent the top half of the box on ranks it never held. The band is now the occupied rank range: better is still up, worse
still down, and the "#" end labels name what each edge stands for. `maxRank` is unchanged and still pins the top band at
#1, which is what small multiples need to share a scale.

**QuadrantDot keeps the box its marks do not need.** The plot was inset by the focal halo, and that halo carried a flat
1.4-unit rim at every size, so the 24-unit default plotted its field into 16.4 of its 24 units. The rim is now 30% of
the focal it wraps and still stops at 1.4, and the inset is that radius alone rather than a 3-unit floor on top of it.
The default box gains 1.6 units of plot per axis, an 8-unit glyph gains 1.8, and the halo stays inside the viewBox.

**PercentileTrace and WinProbWorm take `domain`.** Both keep the full fixed frame as the default, because truncating a
percentile or a probability inflates a small move into a rout. Pass a narrower extent when you are reading a run that
lives in one corner of it; anything outside lands on the plot edge, never past it.
