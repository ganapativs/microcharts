// Interactive charts must size EXACTLY like their static twin — same box, same
// fluid fill — with interaction layered on top, never a different size. The
// canonical shape (see sparkline/client.tsx) is:
//
//   1. destructure `className` + `style` from props (so they DON'T leak to the
//      composed static via `...rest`),
//   2. forward `className` onto the focusable wrapper (`mc-…-live ${className}`),
//   3. spread `...style` into the wrapper style, and
//   4. put `style={FILL}` on the composed <Static…> so the inner SVG always
//      fills the wrapper.
//
// Break any one and the wrapper's box decouples from the rendered SVG: a
// consumer that stretches the chart (`style={{ width: "100%" }}`, a flex/grid
// cell) gets a chart that won't fill, or — worse — one whose pointer→SVG map
// and highlight land in different places (the activity-grid hover-drift bug).
//
// This guard is a static-analysis gate so a NEW interactive chart can't quietly
// regress the contract the way activity-grid diverged from calendar-strip.
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect } from "vitest";

const CHARTS_DIR = join(import.meta.dirname, "..", "charts");

// Glyph / non-hit-testing interactive entries that render the static directly
// (no focusable wrapper composing a <Static…>) — they carry no pointer map and
// no fluid-fill promise beyond the static's own, so the contract doesn't apply.
// Keep this list SHORT and justified; a chart with hover/crosshair is never here.
const EXEMPT = new Set<string>([
  "delta", // pure entrance animation on the static glyph; no wrapper hit-test
  "status-dot",
  "trend-arrow",
  "token-confidence",
]);

const clients = readdirSync(CHARTS_DIR, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .filter((name) => {
    try {
      readFileSync(join(CHARTS_DIR, name, "client.tsx"), "utf8");
      return true;
    } catch {
      return false;
    }
  });

describe("interactive fill contract", () => {
  it("covers a realistic number of interactive charts", () => {
    expect(clients.length).toBeGreaterThan(90);
  });

  for (const name of clients) {
    if (EXEMPT.has(name)) continue;
    const src = readFileSync(join(CHARTS_DIR, name, "client.tsx"), "utf8");

    // Only enforce on entries that compose a focusable wrapper around a static
    // twin (the interactive pattern). Direct-render glyphs fall through.
    const composesStatic = /<Static[A-Z]\w*/.test(src);
    const hasWrapper = /role="img"/.test(src);
    if (!composesStatic || !hasWrapper) continue;

    describe(name, () => {
      it("forwards `className` onto the wrapper (not the composed SVG)", () => {
        expect(src, `${name}: wrapper className must interpolate the consumer className`).toMatch(
          /className=\{[^}]*\$\{className\}/,
        );
      });

      it("spreads consumer `style` into the wrapper", () => {
        expect(src, `${name}: wrapper style must spread ...style`).toMatch(/\.\.\.style\b/);
      });

      it("fills the wrapper with FILL on the composed static", () => {
        expect(src, `${name}: composed <Static…> must carry style={FILL}`).toMatch(
          /style=\{FILL\}/,
        );
      });

      it("destructures `className`/`style` off props (so neither leaks to the SVG)", () => {
        // Both must be pulled out of the props destructure — whether the chart
        // forwards the rest via `...rest` or lists props explicitly. Once
        // destructured they can only reach the wrapper, never the composed SVG.
        const destructured = /\bclassName\s*,/.test(src) && /\bstyle\s*,/.test(src);
        expect(destructured, `${name}: destructure className + style off props`).toBe(true);
      });
    });
  }
});
