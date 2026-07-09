---
"@microcharts/react": minor
---

Batch 3 (expressive) — `TreeRings` (`./tree-rings`), static + `/interactive` entries:

- `TreeRings` — how growth accumulated period over period, like the rings of a tree:
  oldest at the centre, each new period adds a ring outward whose **thickness** is that
  period's value. The channel is radial thickness, NOT area (equal thickness at a larger
  radius spans more area — the ring illusion; the docs say "compare thicknesses"). No
  minimum visual thickness — a near-zero period looks near-zero, and a zero-value period
  collapses its boundaries. `accent="last"|"none"|index` emphasizes a boundary (1.5×
  weight + accent color, never color alone); `total` scales the disc to Σdata/total of
  the radius (the cohort-age story); `rings="stroke"|"fill"`; `label="last"`. The
  interactive entry steps rings from the centre out with ←/→ (radial pointer lookup).

New `EN_TREE` summary module (`treeRings`, `treeRingAt`). The full-annulus path is
inlined (evenodd fill) rather than importing `core/arc`, keeping the static entry at
1.78 kB. **Naming note (plan/12):** the spec's `style` render variant collides with the
universal `style?: CSSProperties`, so it ships as `rings`. Node budget n + 1.
