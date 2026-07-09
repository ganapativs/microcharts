---
"@microcharts/react": minor
---

Batch 2 wave 3 — `QuadrantDot` (`./quadrant-dot`), static + `/interactive` entries:

- `QuadrantDot` — where does this item sit in the 2×2, against the field? A focal
  dot placed by 2-D position, a hairline cross at the split (default = domain
  midpoints, always overridable but **never hidden**), a faint tint on the
  focal's quadrant, and tiny muted ghost dots for the peers. The read is quadrant
  **membership** first, so it lives at glyph scale (24×24) with no in-chart text —
  axis meaning rides on `title` + summary (skipping them is the documented
  anti-pattern). `xDomain`/`domain`, `split`, `field`, `quadrants` (names in
  reading order, summaries only), `xLabel`/`yLabel`, `region` (tint off for dense
  grids). Boundary rule: ≥ split ⇒ right/top; a degenerate axis centers the focal
  and suppresses that split line. The interactive entry cycles the peers
  nearest-first with coords + quadrant, and a pointer picks the nearest dot.

New `EN_QUADRANT` summary module (`quadrantName`, `quadrant`, `quadrantLone`,
`quadrantAt`) and a `data-mc-ink="region"` tint role (accent 5%, drops out under
forced-colors).
