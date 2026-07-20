// Interactive charts must size EXACTLY like their static twin — same box, same
// fluid fill — with interaction layered on top, never a different size. The
// canonical shape (see sparkline/client.tsx) is:
//
//   1. destructure `className` + `style` from props (so they DON'T leak to the
//      composed static via `...rest`),
//   2. spread the shared `wrap("mc-…-live", className, style)` helper onto the
//      focusable wrapper — it composes the consumer className after the base
//      class and merges the consumer style over the wrapper base, and
//   3. put `style={FILL}` on the composed <Static…> so the inner SVG always
//      fills the wrapper.
//
// The wrapper className/style logic lives in ONE place (shared/interactive.ts)
// so every entry pays for it once and it can't drift chart-to-chart; the unit
// test at the bottom pins that helper's behavior. Break the delegation and the
// wrapper's box decouples from the rendered SVG: a consumer that stretches the
// chart (`style={{ width: "100%" }}`, a flex/grid cell) gets a chart that won't
// fill, or — worse — one whose pointer→SVG map and highlight land in different
// places (the activity-grid hover-drift bug).
//
// This guard is a static-analysis gate so a NEW interactive chart can't quietly
// regress the contract the way activity-grid diverged from calendar-strip.
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect } from "vitest";
import { wrap, fillFor, FILL } from "../shared/interactive.js";

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
    // The focusable wrapper is named through `named(…)`, which emits role/tabIndex
    // (or `aria-hidden` when the chart is decorative). Match the helper, not a
    // literal `role="img"` — that string no longer appears in a client entry, and
    // matching it silently skipped this whole suite.
    const hasWrapper = /\bnamed\(/.test(src) || /role="(img|slider)"/.test(src);
    if (!composesStatic || !hasWrapper) continue;

    describe(name, () => {
      it("delegates wrapper className + style to the shared `wrap` helper", () => {
        // The focusable wrapper spreads `wrap("mc-…-live", className, style)` (or
        // the `wrapAttrs` alias where a local `wrap` ref exists), routing BOTH
        // the consumer className and style through the one shared composer — so
        // neither can reach the composed SVG and the merge can't drift per chart.
        expect(src, `${name}: wrapper must spread wrap(base, className, style)`).toMatch(
          /\{\.\.\.wrap(?:Attrs)?\(\s*"[^"]+",\s*className,\s*style\s*\)\}/,
        );
      });

      it("fills the wrapper with fillFor(style) on the composed static", () => {
        // `fillFor`, not the bare `FILL` constant: the SVG must also receive any
        // sizing the consumer set, or a CSS-sized chart (`height: 1.2em` on an
        // `.mc-inline` host) shrinks the wrapper while the mark stays at its
        // authored pixel size and overflows the line.
        expect(src, `${name}: composed <Static…> must carry style={fillFor(style)}`).toMatch(
          /style=\{fillFor\(style\)\}/,
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

  describe("shared wrap() helper", () => {
    it("composes className after the base class", () => {
      expect(wrap("mc-x", "user", undefined).className).toBe("mc-x user");
      expect(wrap("mc-x", undefined, undefined).className).toBe("mc-x");
    });

    it("merges consumer style over the wrapper base (base wins nothing it sets)", () => {
      const base = wrap("mc-x", undefined, undefined).style;
      expect(base).toMatchObject({ display: "inline-block", position: "relative", lineHeight: 0 });
      const merged = wrap("mc-x", undefined, { width: "100%", display: "block" }).style;
      // consumer overrides win; untouched base keys survive.
      expect(merged).toMatchObject({ display: "block", width: "100%", position: "relative" });
    });
  });
});

describe("fillFor() — consumer sizing reaches the SVG", () => {
  it("passes FILL through when the consumer sizes nothing", () => {
    expect(fillFor(undefined)).toBe(FILL);
    expect(fillFor({ margin: 4 })).toBe(FILL);
  });

  it("forwards sizing declarations and drops FILL's own so they can't fight", () => {
    // The inline case: `height: 1.2em` must resize the MARK, not just the
    // wrapper — otherwise the SVG keeps its authored pixel size and overflows
    // the line, which is how the interactive twin grew next to the static one.
    expect(fillFor({ height: "1.2em", width: "auto" })).toEqual({
      display: "block",
      height: "1.2em",
      width: "auto",
    });
    // One axis given → the other follows, so the drawing scales instead of
    // letterboxing inside a box the pointer map measures in full.
    expect(fillFor({ height: "1.2em" })).toEqual({
      display: "block",
      height: "1.2em",
      width: "auto",
    });
    expect(fillFor({ width: "100%" })).toEqual({
      display: "block",
      width: "100%",
      height: "auto",
    });
  });

  it("leaves decorative declarations on the wrapper alone (no doubled margin)", () => {
    expect(fillFor({ height: 20, margin: 8, background: "red" })).toEqual({
      display: "block",
      height: 20,
      width: "auto",
    });
  });
});
