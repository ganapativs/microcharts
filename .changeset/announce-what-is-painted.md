---
"@microcharts/react": patch
---

Eight charts announced something they did not paint. `PartitionStrip` described the whole tree while the strip caps at
24 segments, so a wide bundle breakdown named a group count — and a "largest" — that was never drawn. `Constellation`
announced a largest event on jittered data, where the geometry deliberately rings none. `ConfusionGrid` formatted the
raw accuracy in the gutter and the 2-dp-rounded one in the summary, so a matrix landing on a `.xx5` boundary painted 58%
and said 57%. `BurnChart` painted a red `+7 d` schedule verdict for a chart with no plan recorded. `ForecastCone`
counted raw array lengths for the horizon, inflating it by every non-finite entry the chart dropped. `Waterfall` showed
`0` for a flat step in the chip and `+0` in the live region and in the `formatted` a consumer lifts into its own KPI
card. `GradeProfile` announced `∞%` and handed `Infinity` to `onActive` for a pitch over a subnormal run. `Hourglass`
read a value dropout as a threshold crossing and announced the same sentence a real drain to 0% does.

Adds `constellationPlain` to `SummaryStrings` — the sentence for sparse events with no ranking channel.
