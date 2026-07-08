---
"@microcharts/react": minor
---

Batch 2 wave 2 — `QuantileDots` (`./quantile-dots`), static + `/interactive` entries:

- `QuantileDots` — a quantile dotplot: `count` dots (default 20) at equal-probability
  quantiles (Kay/Fernandes binning from `core/quantile`), stacked into columns. Each
  dot ≈ a 1-in-count chance — NOT a raw observation. With a `threshold`, the dots past
  the line are re-inked accent AND ringed (never color-alone), and the summary uses
  frequency framing ("10 in 20"), never a bare percentage. `count` (capped at 25),
  `side="above" | "below"`. The interactive entry is the probe: hovering / arrowing
  moves a live threshold and the count past it recomputes purely.

New `EN_FREQ` keys `quantileDots` / `quantileDotsRange` (shares the frequency-framing
module with IconArray). **Audit flag (plan/12):** the studied dotplot (Kay 2016 /
Fernandes 2018) used 50 dots; the 15–20 default is a micro-scale countability judgment,
not a validated equivalence.
