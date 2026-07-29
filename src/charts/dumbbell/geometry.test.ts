import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { dumbbellGeometry, dumbbellLabelChars } from "./geometry.js";

const base = { width: 60, height: 12, gutterCh: 0, fontSize: 6 };

describe("dumbbellGeometry", () => {
  it("from/to positions share one scale; direction from data, not order", () => {
    const fwd = dumbbellGeometry({ ...base, pairs: [{ from: 62, to: 84 }] });
    const rev = dumbbellGeometry({ ...base, pairs: [{ from: 84, to: 62 }] });
    expect(fwd.rows[0]!.dir).toBe(1);
    expect(rev.rows[0]!.dir).toBe(-1);
    // renders identically: same two positions, swapped roles
    expect(fwd.rows[0]!.x0).toBe(rev.rows[0]!.x1);
    expect(fwd.rows[0]!.x1).toBe(rev.rows[0]!.x0);
  });

  it("from === to → coincident positions, dir 0", () => {
    const geo = dumbbellGeometry({ ...base, pairs: [{ from: 50, to: 50 }] });
    expect(geo.rows[0]!.x0).toBe(geo.rows[0]!.x1);
    expect(geo.rows[0]!.dir).toBe(0);
  });

  it("non-finite ends → null position, dir 0", () => {
    const geo = dumbbellGeometry({ ...base, pairs: [{ from: Number.NaN, to: 50 }] });
    expect(geo.rows[0]!.x0).toBeNull();
    expect(geo.rows[0]!.x1).not.toBeNull();
    expect(geo.rows[0]!.dir).toBe(0);
  });

  it("a gutter that leaves no plot is refused, not clamped", () => {
    // 4 chars at fontSize 7 reserve a 37-unit gutter. In a 20-unit box that put
    // plotX0 (39) past plotX1 (18) and painted the pair outside the viewBox.
    expect(dumbbellLabelChars({ width: 20, height: 12, rows: 1, fontSize: 7, longest: 400 })).toBe(
      0,
    );
    const geo = dumbbellGeometry({
      width: 20,
      height: 12,
      pairs: [{ from: 1, to: 2 }],
      gutterCh: 0,
      fontSize: 7,
    });
    expect(geo.plotX0).toBeLessThan(geo.plotX1);
  });

  test.prop([
    fc.integer({ min: 6, max: 400 }),
    fc.integer({ min: 4, max: 200 }),
    fc.integer({ min: 1, max: 5 }),
    fc.integer({ min: 7, max: 11 }),
    fc.integer({ min: 1, max: 40 }),
  ])(
    "the reserved gutter always leaves a plot inside the box",
    (width, height, rows, fontSize, longest) => {
      const chars = dumbbellLabelChars({ width, height, rows, fontSize, longest });
      const geo = dumbbellGeometry({
        width,
        height,
        pairs: Array.from({ length: rows }, () => ({ from: 0, to: 1 })),
        gutterCh: chars > 0 ? chars + 1 : 0,
        fontSize,
      });
      expect(geo.plotX0).toBeLessThanOrEqual(geo.plotX1);
      expect(geo.plotX1).toBeLessThanOrEqual(width);
    },
  );

  it("row names drop under a pitch shorter than one line of text", () => {
    // The static entry gated on this; the interactive one did not, so the client
    // reserved a gutter the painted chart never had (rings a gutter off the dots).
    expect(dumbbellLabelChars({ width: 77, height: 28, rows: 5, fontSize: 11, longest: 5 })).toBe(
      0,
    );
    expect(dumbbellLabelChars({ width: 220, height: 80, rows: 5, fontSize: 11, longest: 5 })).toBe(
      5,
    );
  });

  test.prop([
    fc.array(
      fc.record({
        from: fc.double({ noNaN: true, min: -1e4, max: 1e4 }),
        to: fc.double({ noNaN: true, min: -1e4, max: 1e4 }),
      }),
      { minLength: 1, maxLength: 5 },
    ),
    fc.integer({ min: 0, max: 7 }),
  ])("containment: all dots inside the box", (pairs, gutterCh) => {
    const height = pairs.length * 12;
    const geo = dumbbellGeometry({ width: 60, height, pairs, gutterCh, fontSize: 6 });
    for (const row of geo.rows) {
      for (const x of [row.x0, row.x1]) {
        if (x !== null) {
          expect(x).toBeGreaterThanOrEqual(geo.plotX0 - 0.01);
          expect(x).toBeLessThanOrEqual(geo.plotX1 + 0.01);
        }
      }
      expect(row.y).toBeGreaterThanOrEqual(0);
      expect(row.y).toBeLessThanOrEqual(height);
    }
  });
});
