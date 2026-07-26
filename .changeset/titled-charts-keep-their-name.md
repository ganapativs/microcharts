---
"@microcharts/react": patch
---

`summary={false}` no longer discards an explicit `title` — and the two entries of a chart now agree on what it means.

The static and interactive entries resolved the decorative opt-out differently. `accessibleNaming` (static) returned
`aria-hidden="true"` for `summary === false` unconditionally, so `<Sparkline title="Weekly revenue" summary={false} />`
rendered `<svg aria-hidden="true">` with no `<title>` — the only name the author wrote, dropped on the floor. Every
interactive wrapper resolved the same props to `role="img" aria-label="Weekly revenue"`. Same component, same props, one
of them in the accessibility tree and one of them not.

The rule is now one rule, applied on both sides: **`summary={false}` drops the generated sentence, and the chart leaves
the accessibility tree only when that leaves it with no name at all.** With no `title` — the common inline case the
opt-out exists for — nothing changes: `aria-hidden="true"`, no `<title>`/`<desc>`, and on an `/interactive` entry no tab
stop. With a `title`, the chart is now exposed on both sides and announced as its title alone. To silence a titled
chart, drop the title.

Fixed in `shared/a11y.ts` (every chart drawn through `<Chart>`) and by hand in `Delta` and `TokenConfidence`, which
render inline HTML; `TokenConfidence`'s client entry already applied it. `Delta` also stopped falling back to its
generated sentence when a titled caller had opted out of it. `SpreadBand` and `StationGlyph` forwarded `title` into the
static child they compose, which would now name that child too — a second `role="img"` inside the wrapper's; the child
is named by the wrapper, as in every other entry.

The static/interactive matrix (`summary={false}` × `title`, role + `aria-hidden` + accessible name) is now a shared test
rather than a convention.
