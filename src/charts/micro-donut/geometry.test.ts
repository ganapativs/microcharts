import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { microDonutGeometry } from "./geometry.js";

describe("microDonutGeometry", () => {
  it("wedges start at 12 o'clock, sweep clockwise, separated by gaps", () => {
    const geo = microDonutGeometry({ size: 24, shares: [0.5, 0.5], weight: 5 });
    expect(geo.wedges.length).toBe(2);
    expect(geo.wedges[0]!.a0).toBe(0);
    expect(geo.wedges[1]!.a0).toBeGreaterThan(geo.wedges[0]!.a1); // gap
  });

  it("single category → full annulus", () => {
    const geo = microDonutGeometry({ size: 24, shares: [1], weight: 5 });
    expect(geo.wedges.length).toBe(1);
    expect(geo.wedges[0]!.a1 - geo.wedges[0]!.a0).toBeCloseTo(Math.PI * 2, 1);
  });

  it("zero/negative shares are excluded", () => {
    const geo = microDonutGeometry({ size: 24, shares: [2, 0, -1, 3], weight: 5 });
    expect(geo.wedges.length).toBe(2);
  });

  test.prop([
    fc.array(fc.double({ min: 0.01, max: 100, noNaN: true }), { minLength: 1, maxLength: 4 }),
  ])("containment: all path coords inside the box", (shares) => {
    const geo = microDonutGeometry({ size: 24, shares, weight: 5 });
    for (const w of geo.wedges) {
      for (const m of w.d.matchAll(/-?\d+(?:\.\d+)?/g)) {
        const v = Number(m[0]);
        expect(v).toBeGreaterThanOrEqual(-0.01);
        expect(v).toBeLessThanOrEqual(24.01);
      }
    }
  });
});
