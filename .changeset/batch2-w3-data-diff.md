---
"@microcharts/react": minor
---

Batch 2 wave 3 — `DataDiff` (`./data-diff`), static + `/interactive` entries:

- `DataDiff` — what changed between two versions of the data? One diverging bar
  per key: **removed leftward, added rightward, both always drawn** on one
  symmetric shared scale, so a +500/−480 churn never looks like a +20/−0 trickle.
  `labels` (in-chart key tags), `net` (a tick at added−removed — a summary mark,
  never a stand-in for the two bars), `sort` (`"none"` keeps the input order,
  which is often meaningful), `label="totals"` (a `+added / −removed` footer),
  `domain` (a shared scale for cross-chart comparison). Negative counts are
  magnitudes → clamped to 0; a 0/0 key keeps a hairline placeholder tick (absence
  of change ≠ absence of the key); more than 12 rows warns and steers to a table
  of DataDiffs rather than truncating silently. The interactive entry steps the
  rows and announces each key's added, removed, and net change.

New `EN_DATA_DIFF` summary module (`dataDiff`, `dataDiffEmpty`, `dataDiffAt`).
