---
"@microcharts/react": patch
---

Fix the `draw` entrance so a line chart reveals under one front.

The entrance now sweeps a single clip window across the chart in shared view-box units. Three things were wrong before,
and every chart in the `draw` family showed at least one of them:

- Only the primary `data`/`accent` path was in the story act. A companion series, a ghost, an area fill and a bare
  `<line>` were treated as stage ink, so they faded in whole at t=0 and sat there finished while the primary was still
  drawing — a dual sparkline showed its comparison line before its own.
- `stroke-dasharray` is measured along one subpath and restarts on the next, so any path with more than one — a series
  with gaps, a worm split into two coloured halves, a staff of rules, a strip of small multiples — spawned a separate
  front per subpath, all at once, each finishing at its own rate.
- A riding dot's pop was normalized against the other dots' extent, so the leftmost one always popped at t=0 instead of
  when the front reached it.

Rings, spokes and trajectories that double back in x are not drawn along x, so they keep the true stroke reveal:
`progress-ring`, `micro-donut`, `star-spoke`, `phase-trace` and `constellation` pass the new `trace` entrance option.

A connector's destination now waits for the connector, so `dumbbell` reads a row in the order its data does: the
"before" ring lands, its bar grows across, then the "after" dot arrives where the change ended. Both endpoints were
story marks, so they popped together and the bar materialized between two dots already in place. `pareto-strip` and
`music-staff` pick up the same per-row timing — their labels ride the wave their own mark does instead of queueing at
one barrier.

`grade-profile`'s ridge draws across the terrain once it has risen, the way `pareto-strip`'s cumulative curve already
did. It is data, not context, and the opening stage fade put the whole profile on screen before any of the ground under
it existed.
