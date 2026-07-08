---
"@microcharts/react": minor
---

Batch 1 wave 5 — six composed-series charts:

- `Waterfall` (`./waterfall`) — signed deltas bridging into a total; zero-anchored total
  bar on by default; `positive="down"` for cost bridges.
- `BumpStrip` (`./bump-strip`) — rank trajectory on an inverted ordinal scale (#1 on
  top); change dots; "#5" → "#1" end labels; null = unranked gap.
- `DualSparkline` (`./dual-sparkline`) — series vs benchmark on ONE shared domain;
  dashed/thinner/neutral reference; coincident-endpoint dedup. `curve="step"` renders
  as linear (documented — keeps the entry inside the 3 kB hard cap).
- `StackedArea` (`./stacked-area`) — share-normalized stack, ≤ 3 series;
  `variant="ridge"` skin; `order="asc"`.
- `Ohlc` (`./ohlc`) — candle/bars price action, ≤ 20 periods rendered (never averaged);
  valence + geometry encode direction.
- `Horizon` (`./horizon`) — 2–3 fold horizon band; mirror/offset modes; authored
  `baseline`; summaries read the unfolded values.

`EN_COMPOSED` split into per-chart string modules (`EN_FLOW`/`EN_VS`/`EN_STACK`/
`EN_OHLC`) so no chart pays for another family's templates. Horizon `domain` prop is
now actually wired to the geometry (was silently ignored).
