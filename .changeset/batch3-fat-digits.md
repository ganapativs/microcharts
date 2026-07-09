---
"@microcharts/react": minor
---

Batch 3 (expressive) — `FatDigits` (`./fat-digits`), static + `/interactive` entries:

- `FatDigits` — the numeral is the exact value; font _weight_ is a redundant,
  preattentive tier (5 or 3 ordinal steps mapped from `domain`) so big numbers pop
  as you scan a dense column. Weight is never the primary read — it is ordinal and
  coarse, and the number is right there. `encode="value"` weights the whole numeral;
  `encode="digit"` weights each digit by its own magnitude. `tiers={3|5}`. Always
  pass a `domain` (a lone number renders at the middle weight, documented). The
  interactive entry eases the weight to its new tier on variable fonts (snaps
  otherwise) with no layout shift, and announces value + tier through a polite region.

New `EN_FAT` summary module (`fatDigits`, `fatDigitsPlain`) + one motion-layer CSS
rule for the weight transition (tspans are inside `.mc-root`, so the reduced-motion
block gates it). **Deviation from FatFonts (plan/12):** the source encodes magnitude
as glyph ink _area_ via a custom font; shipping a font would break zero-dep
(non-negotiable #1), so we map to discrete `font-weight` tiers on the inherited font —
ordinal, never continuous; the numeral is always exact. Static budget 1.6 kB (the
cached `makeFormatter` for grouped numerals is needed) — above the 1.5 kB Delta-class
target but well under the 3 kB hard cap; logged for the batch gate.
