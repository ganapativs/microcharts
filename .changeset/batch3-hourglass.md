---
"@microcharts/react": minor
---

Batch 3 (expressive) — `Hourglass` (`./hourglass`), static + `/interactive` entries:

- `Hourglass` — how much time is gone AND how much remains, the two-sided story a
  progress bar can't tell. Sand fills the top chamber (remaining) and the bottom
  (elapsed), both **area-true**: a naive linear-height fill in a triangular bulb would
  overstate early progress by up to 2×, so the geometry uses closed forms (top:
  remaining `r` fills from the apex to `H·√r`; bottom: elapsed `e` fills from the base
  to `H·(1−√(1−e))`) — sand areas are exactly proportional (lie factor 1). `value` is
  the elapsed fraction (same polarity as `Progress`). A thin neck stream is a binary
  "running" state mark, rendered only while `0 < value < 1` (finished and not-started
  are shape-distinct). `stream` toggle, `label="remaining"|"elapsed"`. The interactive
  entry cross-fades the sand levels and announces only at documented thresholds
  (50/90/100%).

New `EN_HOURGLASS` summary module (`hourglass`). Node budget 4. No `makeFormatter`
(percents computed inline).
