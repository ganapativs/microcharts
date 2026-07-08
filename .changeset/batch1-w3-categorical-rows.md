---
"@microcharts/react": minor
---

Batch 1 wave 3 — five categorical/relationship charts, each with static + `/interactive`
entries:

- `DotPlot` (`./dot-plot`) — named values on one scale; `stem` flips to a zero-anchored
  magnitude read; deterministic label drop-out and coincident-dot de-overlap.
- `Dumbbell` (`./dumbbell`) — hollow→filled before/after per row; `positive` valence for
  changes (documented: drop it for ranges).
- `PairedBars` (`./paired-bars`) — actual vs reference on ONE zero-anchored domain;
  grouped or overlay-ghost modes; ref muted by opacity AND width.
- `Slope` (`./slope`) — two aligned columns, one y-domain; neutral until `positive`;
  greedy endpoint-label dedup; dashed "incomplete" stubs for missing ends.
- `MicroScatter` (`./micro-scatter`) — 2-D position + Pearson r in the summary (claim and
  evidence travel together); linear-only least-squares `trend`; `focal` point.

New summary template modules: `EN_PAIRED` (fromTo/pairs/slopes…), `EN_SCATTER`
(count + relationship tiers). Pluralization fixes in `categories`/`pairs` templates.
