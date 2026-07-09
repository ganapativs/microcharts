---
"@microcharts/react": minor
---

Batch 3 (expressive) — `BalanceBeam` (`./balance-beam`), static + `/interactive` entries:

- `BalanceBeam` — which of two sides outweighs, and roughly by how much. A beam
  tilts toward the heavier side; direction is instant and the angle **saturates** at
  `maxTilt` (read direction + rough magnitude, not an exact ratio — docs steer precise
  ratios to `PairedBars`/`Delta`). The two weights are area-true (half = k·√value). The
  beam endpoints are pre-rotated in geometry (no SVG transform in the static entry, so
  containment is provable from coords). `mode="ratio"` (share-of-whole, default) or
  `mode="difference"` (absolute, scaled by `domain`); `shape="square"|"round"`,
  `label="values"`. The interactive entry eases the beam to its new tilt (CSS geometry
  transition), reveals a side's value on hover or ←/→, and announces when the heavier
  side flips.

New `EN_BEAM` summary module (`balanceBeam`, `balanceBeamBalanced`) + a beam-tilt CSS
transition rule. Node budget ≤ 6.
