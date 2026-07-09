---
"@microcharts/react": minor
---

Batch 3 (expressive) — `SproutRow` (`./sprout-row`), static + `/interactive` entries:

- `SproutRow` — how mature or healthy each item in a small set is, as an ordinal
  growth-stage glyph (seed → sprout → leaf → bloom). Glyph height is **strictly
  monotonic** with stage, so taller always reads as further along and the ordering
  survives without the key; the four stages are discrete with no interpolated
  half-stages (a growth metaphor must not fake continuity). Each item is one filled
  path (thin stem + leaves/head), scaled to the usable height. A `null` value is a
  real gap — it draws only the soil tick, distinct from a seed. `labels` (category
  labels under the slots) and `label="value"` (stage number above each glyph). The
  interactive entry roves items with ←/→ (or hover), announcing each as "Acme: bloom,
  stage 4 of 4." with a focus ring.

New `EN_SPROUT` summary module (`sproutRow`, `sproutStage`, `sproutStageNames`,
`sproutEmpty` — the four stage names carry the i18n contract). Node budget n + 1.
