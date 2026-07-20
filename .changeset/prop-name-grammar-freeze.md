---
"@microcharts/react": minor
---

Prop-name grammar freeze. Non-negotiable #4 says the same prop name means the same thing on every chart — an API audit
before 1.0 found several names carrying two meanings across the catalog. Each is now spelled one way.

**This is a pre-1.0 minor with breaking renames** — permitted under semver for a `0.x` package. Every rename below is
mechanical: pass the new name, get identical output. No rendering, geometry, or accessibility behaviour changed.

| Chart              | Old             | New             | Why                                                               |
| ------------------ | --------------- | --------------- | ----------------------------------------------------------------- |
| `ABStrips`         | `labels`        | `seriesLabels`  | `labels` is a boolean show/hide toggle on 11 other charts         |
| `ShiftHistogram`   | `labels`        | `seriesLabels`  | ⇑                                                                 |
| `SpreadBand`       | `labels`        | `seriesLabels`  | ⇑                                                                 |
| `Waterfall`        | `total`         | `totalBar`      | `total` is a number denominator on 5 other charts                 |
| `ChangePoint`      | `max`           | `maxItems`      | `max` is a scale denominator on `Progress` (mirrors `<progress>`) |
| `DataDiff`         | `max`           | `maxItems`      | ⇑                                                                 |
| `ParetoStrip`      | `max`           | `maxItems`      | ⇑                                                                 |
| `CalibrationStrip` | `variant`       | `mode`          | 13 charts already spelled this `mode`                             |
| `Hypnogram`        | `variant`       | `mode`          | ⇑                                                                 |
| `MinimapStrip`     | `variant`       | `mode`          | ⇑                                                                 |
| `Ohlc`             | `variant`       | `mode`          | ⇑                                                                 |
| `StackedArea`      | `variant`       | `mode`          | ⇑                                                                 |
| `Waveform`         | `variant`       | `mode`          | ⇑                                                                 |
| `WindBarb`         | `variant`       | `mode`          | ⇑                                                                 |
| `DataDiff`         | `sort`          | `order`         | `sort`/`order` were two names for one concept                     |
| `MiniBar`          | `sort`          | `order`         | ⇑                                                                 |
| `PhaseTrace`       | `yDomain`       | `domain`        | its three sibling xy-charts use `domain` + `xDomain`              |
| `EtaBar`           | `formatEta`     | `etaFormat`     | formatter props read `<thing>Format` everywhere else              |
| `PolarClock`       | `formatSegment` | `segmentFormat` | ⇑                                                                 |

**Value renames.** The ordering vocabulary is now `"data" | "asc" | "desc"` plus per-chart extras, so `"none"` and
`"data"` no longer spell the same state:

- `DataDiff` `order`: `"none"` → `"data"` (`"net"`, `"magnitude"` unchanged)
- `MiniBar` `order`: `"none"` → `"data"` (`"desc"`, `"asc"` unchanged)

`SegmentedBar` (`"data" | "desc"`) and `StackedArea` (`"data" | "asc"`) already complied and are untouched.

**Additive.** `ControlStrip` gains `dots="none"` — it was the only `dots` prop in the catalog without the escape hatch,
so `dots="none"` was a type error on that one chart. It now draws no point marks at all, matching `Sparkline`,
`BumpStrip`, `RateVolume` and `StarSpoke`.

`Progress` keeps `max`: it is a true scale denominator and mirrors the web platform's own `<progress value max>`.
