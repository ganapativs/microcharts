// Every interactive chart must SHOW the reading it already speaks.
//
// The bug this gate exists for: CometTrail, IconArray and PictogramRow each
// shipped a full picker — hover ring, roving keyboard, a polite announcement
// naming the unit — and no visible chip. A screen-reader user heard "12 updates
// ago: 40"; a sighted mouse user got a ring and nothing else. Three charts drifted
// that way over ~80 conversions because nothing checked, and the docs told every
// picker chart's reader that selecting a unit "pins its readout".
//
// So: a source-level gate, like the fill contract next door. It reads the
// client entries rather than rendering them (a render matrix over 105 charts
// would be slower and would need a hand-written fixture per chart, which is
// exactly the kind of list that goes stale); the per-chart browser suites
// assert the runtime behavior, and readout-containment.browser.test.tsx asserts
// the chip fits. What can only be caught HERE is the chart that never renders
// a chip at all.
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect } from "vitest";

const CHARTS_DIR = join(import.meta.dirname, "..", "charts");

/**
 * Charts that legitimately paint no chip: the value is already ON the glyph, or
 * the glyph is a count you read by counting. Every entry needs a reason — "it
 * doesn't have one" is not one, and a chart with a unit picker may never be
 * here (its units always have a reading the marks alone don't give).
 */
const NO_CHIP: Record<string, string> = {
  delta: "renders the signed number itself — the chip would be a duplicate",
  "fat-digits": "IS the number, at display size",
  "trend-arrow": "always prints the magnitude beside the glyph",
  "status-dot": "encodes a named state, not a number; the name is the summary",
  "dice-pips": "pips are countable at a glance; a face is 1–6",
  "tally-marks": "marks are countable by design; overflow already prints",
};

const clients = readdirSync(CHARTS_DIR, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .map((name) => {
    try {
      return { name, src: readFileSync(join(CHARTS_DIR, name, "client.tsx"), "utf8") };
    } catch {
      return null; // static-only (WindBarb)
    }
  })
  .filter((c): c is { name: string; src: string } => c !== null);

const pickers = clients.filter((c) => c.src.includes("useActivePicker"));

describe("every interactive chart shows the value it speaks", () => {
  it("covers the whole catalog", () => {
    // Guards the guard: a broken glob here would silently assert nothing.
    expect(clients.length).toBeGreaterThan(100);
    expect(pickers.length).toBeGreaterThan(80);
  });

  for (const { name, src } of clients) {
    const paintsChip = src.includes("mc-spark-readout");
    const isPicker = src.includes("useActivePicker");

    describe(name, () => {
      it("paints a readout chip (or is a documented exception)", () => {
        if (paintsChip) return;
        expect(
          NO_CHIP[name],
          `${name}: renders no .mc-spark-readout. Either show the reading on ` +
            `hover/focus, or add it to NO_CHIP with a reason`,
        ).toBeTruthy();
        // A unit picker always has per-unit readings the marks don't carry.
        expect(isPicker, `${name}: a chart with a unit picker cannot be chip-exempt`).toBe(false);
      });

      if (!paintsChip) return;

      it("gates the chip on a `readout` prop defaulting to true", () => {
        // The documented contract: `readout={false}` suppresses ONLY the chip,
        // so the value can be rendered outside the chart from `datum.formatted`.
        expect(src, `${name}: destructure \`readout = true\` from props`).toMatch(
          /\breadout(?::\s*\w+)?\s*=\s*true\b/,
        );
        expect(src, `${name}: the chip JSX must be gated on that flag`).toMatch(
          /\{\s*(?:readout|showChip)\s*&&/,
        );
      });

      if (!isPicker) return;

      it("hands `formatted` to onActive/onSelect (the chip's own text)", () => {
        // MicroDatum.formatted is documented as "exactly what its in-chart
        // readout chip would show" — IconArray omitted it, so its
        // `readout={false}` escape hatch had no text to render.
        // `formatted: …`, or the shorthand `formatted` closing an object.
        expect(src, `${name}: the picker datum must include \`formatted\``).toMatch(
          /\bformatted\s*[,:}]/,
        );
      });
    });
  }
});
