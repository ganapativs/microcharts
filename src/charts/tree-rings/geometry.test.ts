import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { treeRingsGeometry, treeRingsSize, TREE_SIZE } from "./geometry.js";

const g = (values: number[], total?: number, size = 24) =>
  treeRingsGeometry({ values, size, pad: 1, total });

describe("treeRingsGeometry — radial thickness", () => {
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

describe("hostile config resolves to the documented default", () => {
  it("a non-finite or non-positive size falls back to the default box", () => {
    for (const bad of [Number.NaN, Number.POSITIVE_INFINITY, 0, -20, undefined]) {
      expect(treeRingsSize(bad)).toBe(TREE_SIZE);
    }
    expect(treeRingsSize(40)).toBe(40);
  });

  it("a NaN size no longer emits NaN radii", () => {
    const geo = g([5, 5], undefined, Number.NaN);
    expect(geo.center.cx).toBe(12);
    for (const r of geo.rings) {
      expect(Number.isFinite(r.rOuter)).toBe(true);
      expect(Number.isFinite(r.rInner)).toBe(true);
    }
  });

  it("an infinite total scales like no total, never to a blank disc", () => {
    // `total > 0` passed for Infinity, drove every thickness to 0, and left the
    // disc empty while the summary still announced the periods.
    const inf = g([10, 10], Number.POSITIVE_INFINITY);
    expect(inf.rings[1]!.rOuter).toBeCloseTo(g([10, 10]).rings[1]!.rOuter, 2);
  });

  test.prop([
    fc.integer({ min: 1, max: 400 }),
    fc.array(fc.integer({ min: 0, max: 30 }), { minLength: 1, maxLength: 12 }),
  ])("the span never runs backwards, at any size", (size, values) => {
    const geo = treeRingsGeometry({ values, size, pad: 1 });
    expect(geo.maxR).toBeGreaterThanOrEqual(geo.r0);
    // the centre dot (r0/2) is the innermost paint; it has to fit the box
    expect(geo.r0 / 2).toBeLessThanOrEqual(geo.center.cx + 0.02);
    for (const r of geo.rings) expect(r.rOuter).toBeGreaterThanOrEqual(r.rInner);
  });
});
