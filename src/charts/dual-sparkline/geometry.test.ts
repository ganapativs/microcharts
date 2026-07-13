import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { dualSparklineGeometry } from "./geometry.js";

const base = { width: 60, height: 16, gutterCh: 0, fontSize: 6 };

describe("dualSparklineGeometry", () => {
  it("one shared domain: the same value lands at the same y in both series", () => {
    const geo = dualSparklineGeometry({ ...base, primary: [0, 10], compare: [10, 0] });
    expect(geo.primaryPoints[1]![1]).toBe(geo.comparePoints[0]![1]);
  });

  it("length mismatch: shorter series simply ends (no stretching)", () => {
    const geo = dualSparklineGeometry({ ...base, primary: [1, 2, 3, 4], compare: [1, 2] });
    expect(geo.comparePoints.filter(Boolean).length).toBe(2);
    expect(geo.primaryPoints.filter(Boolean).length).toBe(4);
    // compare's last point sits at index 1's x, NOT the right edge
    expect(geo.lastCompare!.x).toBeLessThan(geo.lastPrimary!.x);
  });

  it("coincident endpoints detected (dedupe to one dot)", () => {
    const geo = dualSparklineGeometry({ ...base, primary: [1, 5], compare: [3, 5] });
    expect(geo.coincident).toBe(true);
  });

  test.prop([
    fc.array(fc.option(fc.double({ noNaN: true, min: -1e4, max: 1e4 }), { nil: null }), {
      maxLength: 40,
    }),
    fc.array(fc.option(fc.double({ noNaN: true, min: -1e4, max: 1e4 }), { nil: null }), {
      maxLength: 40,
    }),
  ])("containment: both series inside the plot", (primary, compare) => {
    const geo = dualSparklineGeometry({ ...base, primary, compare });
    for (const p of [...geo.primaryPoints, ...geo.comparePoints]) {
      if (!p) continue;
      expect(p[0]).toBeGreaterThanOrEqual(0);
      expect(p[0]).toBeLessThanOrEqual(60);
      expect(p[1]).toBeGreaterThanOrEqual(0);
      expect(p[1]).toBeLessThanOrEqual(16);
    }
  });
});
