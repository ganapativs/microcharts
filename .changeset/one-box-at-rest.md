---
"@microcharts/react": patch
---

An interactive chart now paints exactly what its static twin paints when nothing is hovered. Two entries drew a
different box at rest, so any surface that swaps one for the other in place — a gallery upgrading to the live twin, a
docs playground toggling modes — visibly jumped on mount even with `animate` off.

**`QuantileDots` shrank by its own gutter.** The static entry reserves room to the right of the plot for the "N in 20"
odds label and reports that in its `viewBox`; the interactive entry passed `label="none"` to the composed static and
re-drew the odds as an HTML span beside the SVG, so the same props produced a 218-unit box static and a 150-unit box
interactive. That workaround existed because the reserve was sized off the CURRENT count, and a count that changes under
the cursor resized the chart mid-scrub. The gutter is now sized off the widest string the dotplot can ever print
(`count in count`), which makes it a constant: the label goes back inside the SVG, tracks the live threshold, and the
box never moves. `oddsGutter` is exported from the chart's geometry so the interactive entry maps the pointer and
anchors the readout chip across the same box it paints, gutter included.

**The interactive wrapper's width defaults left the inline style.** `width: fit-content` and `max-width: 100%` were
inline on the wrapper span, and an inline declaration beats a consumer class: `className="w-full max-w-md"` sized the
static entry's `<svg>` to its container while the interactive twin stayed shrink-wrapped — one component, two layouts.
Both declarations now live in `styles.css` under `:where([data-mc-host])`, so they still shrink-wrap the mark inside a
flex or grid parent, and any consumer rule wins. Inline `style` on the chart is unaffected. Every interactive subpath
lost a few bytes with them.
