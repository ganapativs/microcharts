---
"@microcharts/react": minor
---

Batch 2 wave 2 — `RetentionCurve` (`./retention-curve`), static + `/interactive` entries:

- `RetentionCurve` — a **step** line (cohort periods are discrete) on a y-domain
  **locked to [0,1]** (the full range is the honest frame for a share; truncating
  the floor manufactures drama). Detects and marks a plateau (mean |Δ| over the
  last `max(3, ⌈n/3⌉)` periods < 0.005) with a dotted horizontal; an optional
  `benchmark` peer curve rides behind as a subordinate dashed muted ghost.
  `curve="smooth"` for editorial contexts (docs note step is the honest default);
  `plateau={false}` for the raw curve. Percent input (max > 1.001) is divided by
  100; non-monotone bumps (resurrection) render as-is, never sorted or smoothed away.

New `EN_RETENTION` summary module (`retention`, `retentionNoPlateau`, `retentionAt`).
