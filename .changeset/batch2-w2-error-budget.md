---
"@microcharts/react": minor
---

Batch 2 wave 2 — `ErrorBudget` (`./error-budget`), static + `/interactive` entries:

- `ErrorBudget` — budget remaining (0–1) against the **steady-burn diagonal** (the
  pace that exactly spends the SLO window); below the diagonal = burning too fast.
  Faster burn-rate reference lines (the Google-SRE 1×/6×/14.4× **convention**, not
  physics) render as faint region context, never data ink; `rates` is configurable.
  `window` sets the full window length (so "now" can sit mid-window); `currentRate`
  is the observed slope over the last `max(2, ⌈n/6⌉)` steps ÷ steady. A budget that
  hits 0 before the window ends stops at an ✕ and the summary reads "Budget exhausted
  at day N of M." Values outside [0,1] are clamped.

New `EN_ERROR_BUDGET` summary module (`errorBudget`, `errorBudgetExhausted`,
`errorBudgetAt`).
