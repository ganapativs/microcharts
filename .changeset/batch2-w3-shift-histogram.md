---
"@microcharts/react": minor
---

Batch 2 wave 3 — `ShiftHistogram` (`./shift-histogram`), static + `/interactive` entries:

- `ShiftHistogram` — mirrored before/after histograms on SHARED bin edges (before up
  muted, after down accent) with the median shift as the takeaway. Bar heights are
  per-side proportions (each side's counts ÷ its own n) on one shared height scale —
  the only allowed normalization — so unequal sample sizes cannot fake a shift, and
  the summary carries both n's when they differ. The mirror carries identity, not
  valence (up ≠ good). `mode="mirror" | "overlay"`, `bins` (shared, Sturges ≤12).
  One side empty → single histogram + "no <side> sample"; no change → "unchanged".

New `EN_SHIFT` summary module (`shift`, `shiftHeld`, `shiftSamples`, `shiftOneSide`,
`shiftBin`). Median computed inline (not via `core/quantile`) to keep the histogram
bundle under the 3 kB static hard cap. Side tags dropped — they collided with the
bars at every micro size; position + color + summary carry identity (plan/12).
