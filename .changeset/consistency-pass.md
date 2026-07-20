---
"@microcharts/react": minor
---

**Breaking (pre-1.0 API freeze): prop-name consistency pass.** Same prop name must mean the same thing across the
catalog. Collisions found in the pre-1.0 audit are renamed; behaviour is unchanged — pass the new name, get identical
output.

| Chart             | Old                       | New               | Why                                                                       |
| ----------------- | ------------------------- | ----------------- | ------------------------------------------------------------------------- |
| `MusicStaff`      | `range`                   | `mode`            | `range` is the peer-band recipe on `BenchmarkStrip`                       |
| `PercentileTrace` | `bands`                   | `showBands`       | `bands` is qualitative thresholds on `Bullet`                             |
| `FoldedDayBand`   | `bands`                   | `percentiles`     | ⇑; avoided `levels` (already `DepthWedge` / `GradedBand`)                 |
| `Waterfall`       | `start`                   | `open`            | `start` collided with PolarClock / ActivityGrid; avoided `from` (`Delta`) |
| `PolarClock`      | `start`                   | `origin`          | ⇑                                                                         |
| `ActivityGrid`    | `start`                   | `anchor`          | ⇑                                                                         |
| `OrbitStatus`     | `alert`                   | `threshold`       | Decision cutoffs spell `threshold` elsewhere                              |
| `CyclePlot`       | `trend: "line" \| "none"` | `trend?: boolean` | Matches `MicroScatter`                                                    |

**Non-breaking (same PR):** empty-state `seat` on 11 charts; `LiveRegion` on dice-pips / tally-marks / hourglass;
`data-mc-ink` on Slope + forced-colors for `data-mc-status`; Delta / Bullet / ActivityGrid / TokenConfidence English via
`strings-*`; core `clamp` / `lastFinite` reuse; docs registry + MDX synced (catalog.json / llms surfaces regenerate).

Examples microsites migrate after publish — not in this release.
