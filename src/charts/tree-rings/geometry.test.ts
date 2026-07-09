import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { treeRingsGeometry } from "./geometry.js";

const g = (values: number[], total?: number) =>
  treeRingsGeometry({ values, size: 24, pad: 1, total });

describe("treeRingsGeometry (plan/24 #13) — radial thickness", () => {
  it("one ring per period; radii march outward", () => {
    const geo = g([5, 5, 5, 5]);
    expect(geo.rings.length).toBe(4);
    for (let i = 1; i < geo.rings.length; i++) {
      expect(geo.rings[i]!.rOuter).toBeGreaterThan(geo.rings[i - 1]!.rOuter);
    }
  });

  it("thickness ∝ value (a period twice as big is twice as thick)", () => {
    const geo = g([1, 2]);
    const t0 = geo.rings[0]!.rOuter - geo.rings[0]!.rInner;
    const t1 = geo.rings[1]!.rOuter - geo.rings[1]!.rInner;
    expect(t1 / t0).toBeCloseTo(2, 1);
  });

  it("a zero-value period has zero thickness (coincident boundaries)", () => {
    const geo = g([5, 0, 5]);
    expect(geo.rings[1]!.rOuter).toBe(geo.rings[1]!.rInner);
  });

  it("total scales the disc to Σdata/total of the radius", () => {
    const full = g([10, 10]); // Σ=20, denom=20 → fills to maxR
    const half = g([10, 10], 40); // denom=40 → fills to ~half the span
    expect(half.rings[1]!.rOuter).toBeLessThan(full.rings[1]!.rOuter);
    expect(full.rings[1]!.rOuter).toBeCloseTo(full.maxR, 1);
  });

  test.prop([fc.array(fc.integer({ min: 0, max: 30 }), { minLength: 1, maxLength: 24 })])(
    "every ring stays within maxR",
    (values) => {
      const geo = treeRingsGeometry({ values, size: 24, pad: 1 });
      for (const r of geo.rings) {
        expect(r.rOuter).toBeLessThanOrEqual(geo.maxR + 0.02);
        expect(r.rInner).toBeGreaterThanOrEqual(geo.r0 - 0.02);
      }
    },
  );
});
