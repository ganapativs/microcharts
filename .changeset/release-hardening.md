---
"@microcharts/react": patch
---

Pre-1.0 hardening pass. Every fix below is behavioural correctness — no public prop changed (those are in the separate
grammar-freeze changeset). Each is now guarded by a catalog-wide test so it can't regress.

**Inline sizing parity (was a blocker).** A chart switched to its `/interactive` entry took a different amount of space
on the line than its static twin. Two causes: the `.mc-inline` glyph rules were direct-child selectors the interactive
wrapper broke, and CSS sizing (`height: 1.2em`, `width: 100%`) reached the wrapper but not the composed SVG, so the mark
kept its authored pixel size and overflowed. Static and interactive now occupy an identical box at every size — verified
across the whole catalog.

**Pointer accuracy.** Twelve interactive charts reported the wrong unit under the cursor. Causes ranged from a hit-test
index computed against a filtered array while read back against the unfiltered one (`Ohlc` — candles after a corrupt
period reported their neighbour's values), to a controlled-selection round trip off by one per gap (`RetentionCurve`), a
`variant="envelope"` waveform hit-tested on the bar pitch, a fixed hit radius against a size-proportional dot
(`QuadrantDot`), phantom navigable units on all-zero data (`ParetoStrip`, `PercentileLadder`), and a focus ring that
CSS-lerped across the chart while roving (`BalanceBeam`).

**Focus-ring symmetry.** Rings now sit concentric around the marks they enclose (`PairedBars`, `SproutRow`, `Waterfall`)
instead of hugging a band the mark sits off-centre in.

**Renders safely on degenerate input.** Twelve charts previously threw or leaked `NaN`/`undefined` into markup and
accessible names on empty, all-null, or `NaN`/±Infinity data. A null value now reads as "no data" — visible but distinct
from a real zero — never a fabricated measurement.

**Degrades at small sizes.** Thirty-two charts overlapped or spilled their labels outside the viewBox when the box
shrank (a Dumbbell in a tab header stacked its row names; a Thermometer squashed to a blob). Labels now drop cleanly —
with their reserved gutter, without reflowing the plot — so every chart stays legible down to at least half its default
size.

**Accessibility.** A decorative interactive chart (`summary={false}`, no `title`) was a focusable `role="img"` with no
accessible name; it is now correctly `aria-hidden` and non-focusable, matching the static entry.
