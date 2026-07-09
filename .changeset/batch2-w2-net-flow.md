---
"@microcharts/react": minor
---

Batch 2 wave 2 — `NetFlow` (`./net-flow`), static + `/interactive` entries:

- `NetFlow` — inflow area above a zero baseline, outflow mirrored below on **one
  shared magnitude scale** (never independently balanced), with the net line
  (`in − out`) on top restoring the precise decision value. `mode="area" | "bars"`
  (bars, and single periods, avoid an area through one point); `net={false}` for
  gross flows only; `positive="down"` swaps the valence coloring for debt-paydown
  contexts (color = which direction is good, position = in/out identity — two
  independent channels). Negative inputs are invalid (flows are magnitudes) and
  coerced to 0; the net sign is stated in the label's **text**, never color-alone.

New `EN_NET_FLOW` summary module (`netFlow`, `netFlowAt`, `netFlowNoFlow`) — the
summary and live region always pair the net with its gross.
