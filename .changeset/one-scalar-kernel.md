---
"@microcharts/react": minor
---

The twenty single-unit charts share one activation kernel, and Escape now works on all of them.

Every scalar client (Progress, MoonPhase, Delta, WindBarb, Thermometer, and the rest of the family) used to carry its
own copy of the same block: an edge-gated activate(), six listeners, and an Enter/Space handler. The copies had drifted
— nine of them preventDefaulted Enter with no `onSelect` to fire — and none offered a way to lower the hover/focus
reveal without leaving the chart. They now share `useScalarActive`: hover and focus report one `onActive` edge,
click/Enter/Space report the same datum through `onSelect`, and Escape lowers the chip with focus unmoved, the same exit
the picker kernel gives a pin. The five chip-less scalars memoize their static SVG, so a hover edge no longer re-renders
the mark.

`SparkGroup` renders a `<span>` instead of a `<div>`. `.mc-group` is `inline-flex` either way, but a div is flow
content: HTML forbids it inside `<p>`, the parser re-parents it out of the paragraph, and hydrating a server-rendered
group in prose failed with a full client re-render. Word-sized charts live in sentences; their group wrapper is now
phrasing content like they are.

Consistency behind the scenes: the four charts that hand-rolled `aria-live` regions render the shared `LiveRegion`
(MinimapStrip gains the inline seat hoist it was missing), 36 static entries resolve their accessible name through
`resolveSummary` instead of hand-rolled ternaries, `format` is typed by one shared `Format` alias in the six files that
spelled it another way, and `deltaModel` — the one chart model with no unit tests — has them now, property tests
included.

Sizes: the LiveRegion unification let the bundler merge the interactive kernel into one chunk, and ~90 multi-unit
interactive entries shrank 9–23 B each (`sparkline/interactive` 6985 → 6973 B against its 7 kB wall). The scalar entries
pay +31–81 B for the shared hook; minimap-strip absorbs +223 B of merge cost. The RSC fixture now imports 24 real chart
entries from their subpaths instead of a hand-assembled stand-in, and the Tailwind cascade-layer trade-offs are
documented from measurement in Theming.
