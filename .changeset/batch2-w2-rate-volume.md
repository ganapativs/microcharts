---
"@microcharts/react": minor
---

Batch 2 wave 2 — `RateVolume` (`./rate-volume`), static + `/interactive` entries:

- `RateVolume` — a precise rate line over deliberately low-precision, zero-anchored ghost
  volume bars (the denominator). There is no prop to remove the bars, and a rate on **zero**
  volume is never plotted (line gap + zero bar) — the lie this type prevents. `minVolume`
  flags a thin denominator by rendering the rate mark hollow (shape cue, survives
  forced-colors); `curve="linear" | "step"` (no smooth — a rate line must not imply
  between-period values); separate `volumeFormat`. The summary and the interactive live
  region never state a rate without its volume.

New `data-mc-ink="ghost"` ink-role (neutral, low-opacity context) in `styles.css` with a
forced-colors mapping. New `EN_RATE_VOLUME` summary template module (`rateVolume`,
`rateVolumeShort`, `rateVolumeAt`, `rateVolumeNoEvents`).
