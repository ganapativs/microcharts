---
"@microcharts/react": minor
---

Batch 1 wave 2 — five tick/cell strip charts, each with static + `/interactive` entries:

- `RugStrip` (`./rug-strip`) — raw observations as ticks, density via opacity tiers,
  `highlight` for "you are here", never downsamples.
- `MiniBar` (`./mini-bar`) — zero-anchored categorical bars, honest data order, `sort`,
  `highlight`, signed data with `positive` polarity.
- `PictogramRow` (`./pictogram-row`) — countable units (●●●○○), true fractional units as
  circular segments (no clipPath ids), `renderPoint` escape hatch.
- `Seismogram` (`./seismogram`) — event density/intensity ticks, `barcode` mode,
  spike-preserving max-per-bucket downsampling, summaries always from raw values.
- `HeatStrip` (`./heat-strip`) — 1×N calibrated intensity cells sharing ActivityGrid's
  vocabulary; empty ≠ zero; density-adaptive gaps.

Kernel fix: `scaleLinear` now treats denormal-span domains as degenerate (the slope
overflowed to ±Infinity and `0 × Infinity` poisoned coordinates with NaN). New summary
template modules: `EN_CATEGORY`, `EN_DIST`, `EN_SLOTS` (slot-empty announcements — also
fixes the latent "No data.." double period in ActivityGrid's null-cell announcement).
