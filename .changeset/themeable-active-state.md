---
"@microcharts/react": minor
---

The active/hovered unit's treatment is now a supported `--mc-*` channel, and its default is visible on marks the chart
emphasizes.

Every interaction overlay carries `data-mc-active`, and `styles.css` paints it from four opt-in tokens:
`--mc-active-stroke` (ring color), `--mc-active-fill` + `--mc-active-fill-opacity` (the wash inside the ring, `0` for a
bare outline), and `--mc-rest-opacity` (every other mark, while something is active). Restyling the hover state used to
mean scoping CSS onto `data-mc-*` attributes from outside the package, and moving `--mc-accent` to recolor a ring also
repainted endpoint dots and emphasis bars. "Lift the picked unit, dim the rest" is now two declarations on the host.

Fixes: the overlay was invisible on any mark the chart inks with `--mc-accent` — SparkBar's endpoint bar, Pareto's
leader, Thermometer's reading — because an accent outline over an accent fill cancels out. The default now adds a
20%-opacity `--mc-on-fill` wash inside the ring, which is the token defined as the ink that reads on a saturated data
fill, so the treatment lands on every fill in both themes and stays invisible inside a ring that encloses empty plot.

Under forced colors all four tokens collapse back to a system-accent outline: a host's themed ink was chosen against its
own palette, not the user's, and an opacity ramp has nothing to say in a two-ink mode.

Sizes moved by −20 bytes net across the catalog (the marker is shorter than the literal it replaced); no subpath grew by
more than 17 bytes.
