---
"@microcharts/react": minor
---

Interactive readouts stay on screen, and a CSS width fills the box.

**The readout can no longer be clipped.** It was `position: absolute; bottom: 100%`, so any ancestor with `overflow`
other than `visible` cut it off — a chart in a scrolling rail showed a sliver of its label — and it opened upward even
with no room above. It now renders in the top layer and is placed by CSS anchor positioning: it flips below the chart
when there is no room above, stops at the window edge and grows the other way instead of running off-screen, and hides
once its chart scrolls out of view. No measurement, no portal, no scroll listener, and no new props. Chrome, Edge and
Safari place it this way; Firefox has no anchor positioning yet and keeps the previous placement.

If you set `readout={false}`, reserved headroom, or raised a `z-index` to work around a clipped chip, you can drop it.

**Behavior change:** the chip is centered on the chart rather than on the hovered datum. The per-datum offset was an
inline `left`, and an inline `left` outranks the stylesheet — it is what prevented the browser from clamping the chip to
the screen. The crosshair inside the chart still marks the exact datum. `crosshairReadoutStyle` and `rowReadoutStyle`
are gone from the shared entry; neither was documented.

**A CSS width now fills the box.** Charts emitted `width` and `height` as SVG attributes, so a `className="w-full"`
replaced only the width and `preserveAspectRatio` fitted the drawing to the axis you had not touched: an 80×6 Bullet
painted 80px wide, centered, inside a 335px rail, with dead space either side. `.mc-root` now carries `height: auto`, so
the height follows the width, and `max-width: 100%`, so a chart shrinks inside a container narrower than itself instead
of spilling out of it.

**The readout's shadow no longer glows on dark.** It mixed `CanvasText`, which inverts with the theme, so on a dark
surface the blur painted a pale halo around the chip and bled onto the mark beneath it. The new `--mc-surface-shadow`
token is dark in every theme, because a shadow is occlusion; on dark it goes quiet and the chip's 1px edge carries the
separation. Override it like any other token if your surface wants a different weight.
