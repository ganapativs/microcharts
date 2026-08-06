---
"@microcharts/react": minor
---

Slope and PercentileLadder stop losing the label you needed.

**Slope budgets label names by width.** Truncation was pinned at six characters — the truncator's own default, applied
at every size — so two rows whose names shared a six-character prefix both painted the same string, and a 300-unit chart
showed no more of a name than a 40-unit one. The budget now scales with the width, the way DotPlot, Dumbbell and
RubricStrip already do: at 300×54 a twenty-character name renders fourteen characters and an ellipsis, so rows that
shared a prefix read as different rows.

**Slope seats a label on its own line, or drops it.** Labels were spread to a full glyph pitch from their neighbours,
which moved them up to 36% of the chart height away from the line they named — measured on six rows, three of them ended
up nearer another row's line than their own. Each label now sits at its own endpoint, nudged only far enough to clear
the label above it, and is dropped when it cannot sit within half a pitch of its line. Expect fewer labels on a crowded
chart and every remaining one attached to the right line: six endpoints spanning 27 units cannot carry six eight-unit
labels, and a label 19 units from its line was not naming anything.

**PercentileLadder keeps the middle rung.** Labels were placed tail first, then p50, then the interiors, so a collision
always cost an interior label: `ps={[50, 90, 99]}` rendered 50 and 99 and dropped p90, the one you act on. At the
default width of 80 it dropped p90 as well, so the chart never showed all three of its own default percentiles at its
own default size. Labels are now spread to a minimum pitch first, which seats all of them at up to four rungs, and only
a spread that would put a label nearer another rung falls back to seating at the tick — interiors first, so a drop lands
on an end. Across 62,832 configurations, cases with a label nearer a foreign tick went from 18,153 to none, and
three-rung charts keeping every interior label went from 17% to 84%.
