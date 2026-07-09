---
"@microcharts/react": minor
---

Batch 3 (expressive) — `DicePips` (`./dice-pips`), static + `/interactive` entries:

- `DicePips` — a small count or severity read instantly as a canonical die face,
  subitized rather than counted. Only the real 1–6 pip patterns exist; `0` is an
  empty face (zero, not missing), and any value `> 6` renders the exact numeral in
  the face instead of inventing a seven-pip layout — the documented honesty fallback.
  `face={false}` drops the outline for dense table columns. The interactive entry
  cross-fades the pip set on change and announces the new face through a polite
  region; the pips are one value, so there is no cursor to move.

New `EN_DICE` summary module (`dicePips`, `dicePipsOver`). Node budget ≤ 7
(face + up to six pips).
