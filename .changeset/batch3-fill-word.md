---
"@microcharts/react": minor
---

Batch 3 (expressive) — `FillWord` (`./fill-word`), static + `/interactive` entries:

- `FillWord` — the label IS the bar: a muted word overlaid with an accent copy of
  itself, clipped (CSS `clip-path: inset()` — no `<clipPath>` element, so no
  generated id) to the value fraction of the word's OWN inked extent, so 50%
  visually bisects the word and the fill is never of a hidden wider track. Glyph
  extent is estimated deterministically (0.62 em/char) and pinned with `textLength`
  + `lengthAdjust`, so containment is provable server-side without measuring text.
  `mode="fill"|"drain"` (drain empties from the left for a remaining-time / TTL
  story), `label="value"` appends the percent. The interactive entry glides the ink
  edge with a reduced-motion-gated clip-path transition and announces changes
  through a polite region, throttled to ≥1 s.

New `EN_FILL_WORD` summary module (`fillWord`, `fillWordRemaining`) + one motion-layer
CSS rule for the clip-path transition (the accent copy is inside `.mc-root`, so the
existing reduced-motion block gates it). Node budget 2 (+1 numeral).
