import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { dumbbellGeometry } from "./geometry.js";

const base = { width: 60, height: 12, gutterCh: 0, fontSize: 6 };

describe("dumbbellGeometry (plan/22 #11)", () => {
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
