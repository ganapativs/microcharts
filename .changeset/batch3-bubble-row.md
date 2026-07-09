---
"@microcharts/react": minor
---

Batch 3 (expressive) — `BubbleRow` (`./bubble-row`), static + `/interactive` entries:

- `BubbleRow` — roughly how a few magnitudes compare, with physical presence: a row of
  circles whose **area** (r ∝ √value) is proportional to value. This is the catalog's
  honest LOW-precision exemplar — area is the weakest common channel, so the LOW rating
  and the standing **"for precise comparison, use MiniBar"** steer are printed in the
  catalog, `/catalog.json`, and the docs header. Value numerals are ON by default
  (`label="value"`), because a low-precision channel owes the reader the number; `both`
  adds the category label, `none` opts out. `align="center"` (specimen row, default) or
  `"baseline"` (weights on a shelf). No sorting prop — order = data order (reordering is
  the caller's statement). Zero renders a small presence ring. The interactive entry
  roves bubbles with ←/→ (or hover), announcing each one's exact value.

New `EN_BUBBLE` summary module (`bubbleRow`, `bubbleAt`). Node budget 2 per bubble.
