import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { cometLabelBand, cometTrailGeometry, DEFAULT_TRAIL } from "./geometry.js";

const g = (values: readonly number[], trail = 12) =>
  cometTrailGeometry({ values, width: 60, height: 16, trail, pad: 1 });

describe("cometTrailGeometry — rolling window", () => {
  it("head sits at the newest value on the right; trail is the prior points", () => {
    const geo = g([10, 20, 30, 40]);
    expect(geo.head!.index).toBe(3);
    expect(geo.count).toBe(4);
    expect(geo.trail.length).toBe(3);
    // head is the rightmost mark
    expect(geo.head!.cx).toBeGreaterThan(Math.max(...geo.trail.map((t) => t.cx)));
  });

  it("trail is newest-first with age-decreasing opacity", () => {
    const geo = g([1, 2, 3, 4, 5, 6]);
    expect(geo.trail[0]!.opacity).toBeGreaterThan(geo.trail[geo.trail.length - 1]!.opacity);
  });

  it("opacity encodes age, not value (a low recent point is still bright)", () => {
    const geo = g([100, 1, 100]); // middle (recent prior) is low but newest prior
    // trail[0] is the most-recent prior (value 1) — brightest despite low value
    expect(geo.trail[0]!.opacity).toBeGreaterThanOrEqual(geo.trail[1]?.opacity ?? 0);
  });

  it("trail length is context — the head value is unchanged by it", () => {
    expect(g([5, 6, 7, 8, 9], 2).last).toBe(g([5, 6, 7, 8, 9], 12).last);
  });

  it("respects the trail cap (20)", () => {
    const geo = g(
      Array.from({ length: 40 }, (_, i) => i),
      100,
    );
    expect(geo.trail.length).toBeLessThanOrEqual(20);
  });

  it("single point → head only, no trail", () => {
    const geo = g([42]);
    expect(geo.head!.index).toBe(0);
    expect(geo.trail.length).toBe(0);
  });

  it("empty → null head", () => {
    expect(g([]).head).toBeNull();
  });

  it("trend from first to last of the shown window", () => {
    expect(g([1, 2, 3]).trend).toBe(1);
    expect(g([3, 2, 1]).trend).toBe(-1);
    expect(g([5, 5, 5]).trend).toBe(0);
  });

  // A host computes `trail` as often as it types it, and `Number("")` is NaN.
  // NaN fell through `Math.floor` and both clamps, and `slice(-NaN)` is
  // `slice(0)` — the cap stopped existing and the whole stream was painted.
  it("a non-finite trail falls back to the default, never past the cap", () => {
    const long = Array.from({ length: 500 }, (_, i) => i);
    expect(g(long, NaN).count).toBe(DEFAULT_TRAIL + 1);
    expect(g(long, Infinity).count).toBe(21);
    expect(g(long, -1).count).toBe(1);
    expect(g(long, 0.5).count).toBe(1);
  });

  test.prop([fc.array(fc.integer({ min: -50, max: 50 }), { minLength: 1, maxLength: 30 })])(
    "every mark stays inside the box",
    (values) => {
      const geo = g(values);
      const marks = [...geo.trail, ...(geo.head ? [geo.head] : [])];
      for (const m of marks) {
        expect(m.cx - m.r).toBeGreaterThanOrEqual(-0.6);
        expect(m.cx + m.r).toBeLessThanOrEqual(geo.width + 0.6);
        expect(m.cy - m.r).toBeGreaterThanOrEqual(-0.6);
        expect(m.cy + m.r).toBeLessThanOrEqual(geo.height + 0.6);
      }
    },
  );

  // The old head radius was `height * 0.14` with no reference to the box it had
  // to fit. A tall chart in a narrow one (or a label gutter eating the plot)
  // handed `scaleLinear` an inverted range and dots came out at negative cx.
  test.prop([
    fc.integer({ min: 3, max: 200 }),
    fc.integer({ min: 3, max: 200 }),
    fc.array(fc.integer({ min: -50, max: 50 }), { minLength: 1, maxLength: 25 }),
  ])("a hostile aspect ratio still keeps every mark inside the box", (width, height, values) => {
    const geo = cometTrailGeometry({
      values,
      width,
      height,
      trail: 12,
      pad: 1,
      vPad: height * 0.6, // what a caller-set `fontSize` can ask for
    });
    for (const m of [...geo.trail, ...(geo.head ? [geo.head] : [])]) {
      expect(m.cx - m.r).toBeGreaterThanOrEqual(-0.01);
      expect(m.cx + m.r).toBeLessThanOrEqual(geo.width + 0.01);
      expect(m.cy - m.r).toBeGreaterThanOrEqual(-0.01);
      expect(m.cy + m.r).toBeLessThanOrEqual(geo.height + 0.01);
    }
  });
});

describe("cometLabelBand — the numeral's reserved gutter", () => {
  it("reserves room for the text that will actually be printed", () => {
    // Was a flat `fontSize * 3`, which fit ~4 digits and let a 7-digit figure
    // paint ~25 units past the right edge of a 60-wide viewBox.
    const two = cometLabelBand("87", 9, 60, 16);
    const four = cometLabelBand("8712", 9, 60, 16);
    expect(two).toBeLessThan(four);
    expect(two).toBeGreaterThanOrEqual(2 * 9 * 0.62);
  });

  it("drops the numeral rather than crush the window or spill", () => {
    expect(cometLabelBand("9,876,543", 9, 60, 16)).toBe(0); // no window left
    expect(cometLabelBand("87", 40, 60, 16)).toBe(0); // taller than the box
    expect(cometLabelBand(null, 9, 60, 16)).toBe(0); // label="none"
    // …and the same figure fits once there is room for it.
    expect(cometLabelBand("9,876,543", 9, 200, 16)).toBeGreaterThan(0);
  });
});
