microcharts — brand assets
===========================

The mark: three data cells climbing a diagonal inside a superellipse
squircle, fill graded faint → solid. The grade encodes value — the same
honest channel the charts use. Never hand-redraw it; scale the SVG.

The mark
--------
mark.svg               Primary. Cobalt squircle, near-white cells.
mark-dark.svg          The dark-theme cobalt, for a known-dark host.
mark-adaptive.svg      Auto light/dark (embedded prefers-color-scheme).
mark-mono-dark.svg     One ink, dark — for light backgrounds.
mark-mono-light.svg    One ink, light — for dark backgrounds.
mark-ember.svg         Ember accent variant.
mark-teal.svg          Teal accent variant.

The lockup (mark + name)
------------------------
lockup.svg             Primary. Cobalt mark, dark ink name.
lockup-dark.svg        Dark-theme cobalt, light ink name.
lockup-adaptive.svg    Auto light/dark.
lockup-mono-dark.svg   One ink, dark — for light backgrounds.
lockup-mono-light.svg  One ink, light — for dark backgrounds.

The name on its own
-------------------
wordmark.svg           Dark ink — for light backgrounds.
wordmark-light.svg     Light ink — for dark backgrounds.
wordmark-adaptive.svg  Auto light/dark.

The name is set in Open Runde 600 at -0.016em tracking and ships as
outlines, so it renders the same on a machine that has never installed the
face. Don't reset it in another font. Open Runde is OFL; its license
travels in fonts/OpenRunde-OFL.txt.

PNG
---
png/ carries rasters of the mark (256, 512, 1024), its dark and mono
siblings (512), the lockup light and dark (800 and 1600 wide), and the
name (800 wide), all on transparent backgrounds. Use them where SVG isn't
accepted — slides, docs, chat. For anything that scales, use the SVG.

Colors
------
Cobalt (accent), light   #2f52d4
Cobalt (accent), dark    #528dff
Cell fill (near-white)   #faf7f1
Ink (light theme)        #17110a
Paper (light theme)      #e9edf4
Ink (dark theme)         #e9e8e3
Paper (dark theme)       #0a0b0f

Machine-readable in colors.json, accent siblings included.

Usage
-----
Use the mark to link to or reference microcharts. Keep clear space of at
least one cell-width on every side, and don't render the mark below 16px,
where the grade between the cells stops reading. Don't recolor the cells,
rotate, stretch, add effects, or imply endorsement. The name is one
lowercase word: "microcharts" — never MicroCharts, micro charts, or
µcharts. Package: @microcharts/react.

Full terms in LICENSE.txt. Code is MIT. https://microcharts.dev/brand
