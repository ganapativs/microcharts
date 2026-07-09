---
"@microcharts/react": minor
---

Batch 2 wave 3 — `EnsembleGhosts` (`./ensemble-ghosts`), static + `/interactive`
entries (the final Batch 2 chart):

- `EnsembleGhosts` — what could happen across the simulated futures? A faint
  bundle of member paths with one emphasized representative, because a mean line
  hides that futures disagree in **shape**, not just endpoint. Ghost selection is
  **deterministic** — members ranked by endpoint value and picked at evenly
  spaced quantiles of that ranking (no `Math.random`, no jitter), so the same
  input renders identically every time. `ghosts` (default 8, cap 12), `emphasis`
  (`"nearest-median"` = a real member closest to the pointwise median /
  `"median"` = the synthetic median, flagged in the summary / a pinned member
  index), `endpoints` (ghost endpoint dots). Members of unequal length each draw
  to their own length; NaN members are excluded; a single member steers to
  Sparkline.
- The interactive entry is **the HOP loop**: on hover/focus it flips through the
  members one at a time (~400 ms/frame ≈ 2.5 Hz), looping until the pointer
  leaves. Reduced motion turns the loop off — ←/→ step members discretely (the
  same information without motion) — and the live region announces only on a
  keyboard step or when the loop stops, never per frame. A static frame is not a
  HOP; the loop lives only in the interactive entry.

New `EN_ENSEMBLE` summary module (`ensemble`, `ensembleSingle`, `ensembleAt`).
