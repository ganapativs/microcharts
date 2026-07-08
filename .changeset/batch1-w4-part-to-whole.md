---
"@microcharts/react": minor
---

Batch 1 wave 4 — the annotations layer + seven part-to-whole/staged charts:

- `@microcharts/react/annotations` — `<Threshold>`, `<TargetZone>`, `<Marker celebrate?>`,
  `<Callout>` as declarative children; hosts pay only a tiny walker (mark renderers ship
  with this entry). Sparkline/SparkBar retrofitted as hosts.
- `SegmentedBar` (`./segmented-bar`) — composition with a labeled Other rollup +
  largest-remainder percents.
- `HistogramStrip` (`./histogram-strip`) — ≤ 12 uniform bins from raw observations;
  value `highlight`.
- `MicroBox` (`./micro-box`) — five-number box; min-max or tukey whiskers; refuses fake
  boxes (< 5 raw values → dots; non-monotonic stats → refused).
- `ProgressRing` (`./progress-ring`) — fixed 12-o'clock arc, butt caps, `sweep`
  countdown mode; threshold-crossing announcements.
- `MicroDonut` (`./micro-donut`) — ≤ 4 wedges + Other; `decorative` ornament mode.
- `Funnel` (`./funnel`) — stepped columns + retained-share slats; rate-of-first mode;
  inversion notes.
- `LikertStrip` (`./likert-strip`) — diverging valence bar; split/omit neutral (never
  silently dropped); ends/net labels.

New `EN_COMPOSITION` string module + distribution templates (binAt, distribution,
fiveNum, boxStat). Sparkline budget 3.65/4.65 kB pending sign-off (annotations walker).
