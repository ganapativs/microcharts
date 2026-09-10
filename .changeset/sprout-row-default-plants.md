---
"@microcharts/react": patch
---

`SproutRow` with two or more named items at the default labeled height and `label="value"` rendered zero-height plant
glyphs — the chart's primary growth-stage encoding was absent in its default configuration. The stage numeral's band is
now dropped when carving it would leave no room for plants, so the plants render at heights 39–42 (including the default
40); the numeral stays on from 43 up where both it and the plants fit.
