---
"@microcharts/react": patch
---

Eight defects found by a catalog-wide consistency audit — each one a rule the library already states and nothing
checked.

**Labels painted at the wrong size.** `Sparkline label="minmax"` pinned `--mc-label-size` only in `label="last"` mode,
so its two extremum labels were laid out at 5–9 viewBox units and painted at the inherited `0.75em` — measured 1 unit
outside the viewBox top and bottom, and `.mc-root` is `overflow: visible`, so that is a spill into the page. Both labels
now share one baseline (`central`) and one clamp. `TapeGauge` had the same class of bug in reverse: the root pins the
_tick_ size, so the hero readout's `fontSize` attribute was inert and the number painted at 7 units while its clearance
was reserved for up to 13.

**The branded focus ring never applied to anything.** `.mc-root:focus-visible` styles the `<svg>`, but no static sets
`tabIndex` — the tab stop is the wrapper. Every focusable chart fell back to the UA outline. The rule now targets
`[data-mc-host]`.

**`Bullet` had no announcement channel** — the only interactive entry with neither a live region nor `aria-live`. Its
readout carries the signed gap to target, which the accessible name does not, so a screen-reader user could not reach
that number at all.

**`TokenConfidence` ignored the decorative opt-out**: `summary={false}` with no `title` still produced a named
`role="img"` with roving tab stops inside it. It now goes `aria-hidden` and drops the tab stops with it. Its per-token
`onFocus`/`onBlur`/`onPointerEnter` handlers and inline ref callbacks are gone too — focus and hover are delegated to
the host, which matters because a streamed reply re-renders once per token.

**Entrance motion ran off-screen.** The engine's failsafe timeout called the entrance rather than releasing the opacity
hold, so a chart mounted below the fold played its whole animation unseen 400 ms after mount and the reader who scrolled
to it later found a static chart. The failsafe now only reveals; the observer still plays the entrance when the chart is
actually seen.

**`PolarClock` swallowed ↑/↓** — unhandled, so they scrolled the page while a keyboard reader was roving the dial. They
now alias forward/back like every other radial chart.

**`CalendarStrip` reads the wall clock in a static render** (`end` defaults to today, UTC). The default stays — it is
the useful one — but rendering on the server without `end` now dev-warns, because a render that straddles UTC midnight
will not match hydration.

Guards added with the fixes: vertical (top/bottom) label-containment measurement, a focus-ring assertion that resolves
`--mc-accent` through the cascade, an off-screen entrance test, and per-chart tests for the rest. Each was confirmed to
fail against the old behaviour before the fix landed.
