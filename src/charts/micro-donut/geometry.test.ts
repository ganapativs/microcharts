import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import {
  DONUT_MAX_WEDGES,
  DONUT_SIZE,
  donutMaxWedges,
  donutSize,
  microDonutGeometry,
} from "./geometry.js";

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

  it("wedges are stroked open centerlines (no filled sector), weight exposed", () => {
    const geo = microDonutGeometry({ size: 24, shares: [0.5, 0.5], weight: 5 });
    expect(geo.weight).toBe(5);
    for (const w of geo.wedges) {
      // arcPath: single open arc — starts at a move, no sector spoke (L) or close (Z).
      expect(w.d.startsWith("M")).toBe(true);
      expect(w.d).toContain("A");
      expect(w.d).not.toContain("Z");
      expect(w.d).not.toContain("L");
    }
  });

  it("zero/negative shares are excluded", () => {
    const geo = microDonutGeometry({ size: 24, shares: [2, 0, -1, 3], weight: 5 });
    expect(geo.wedges.length).toBe(2);
  });

  it("a hostile size/weight falls back to the documented default, not to NaN", () => {
    const ref = microDonutGeometry({ size: DONUT_SIZE, shares: [0.6, 0.4], weight: 5 });
    for (const size of [Number.NaN, Infinity, -Infinity, 0, -10, undefined]) {
      const geo = microDonutGeometry({ size: size as number, shares: [0.6, 0.4], weight: 5 });
      expect(geo.wedges.map((w) => w.d)).toEqual(ref.wedges.map((w) => w.d));
      expect(geo.y0).toBe(ref.y0);
      expect(geo.y1).toBe(ref.y1);
    }
    for (const weight of [Number.NaN, undefined]) {
      expect(microDonutGeometry({ size: 24, shares: [1], weight }).weight).toBe(ref.weight);
    }
  });

  it("weight is never negative — a negative stroke-width drops the element", () => {
    // Sizes below ~3 leave no room for a band: 0 draws nothing, which is the
    // honest read; -0.5 would make the browser discard the wedge entirely.
    for (const size of [1, 2, 3, 4, 24, 48]) {
      const geo = microDonutGeometry({ size, shares: [0.5, 0.5], weight: 5 });
      expect(geo.weight).toBeGreaterThanOrEqual(0);
    }
  });

  it("donutMaxWedges keeps the cap a ceiling", () => {
    expect(donutMaxWedges(2)).toBe(2);
    expect(donutMaxWedges(2.5)).toBe(2);
    expect(donutMaxWedges(1)).toBe(1);
    for (const n of [Number.NaN, Infinity, 0, -3, undefined]) {
      expect(donutMaxWedges(n as number)).toBe(DONUT_MAX_WEDGES);
    }
    expect(donutSize(48)).toBe(48);
    expect(donutSize(Number.NaN)).toBe(DONUT_SIZE);
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
