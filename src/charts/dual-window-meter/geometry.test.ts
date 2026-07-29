import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { dualWindowGeometry, rollingMean } from "./geometry.js";

describe("dualWindowGeometry", () => {
  it("rolling mean has a leading gap until the window fills", () => {
    expect(rollingMean([1, 2, 3, 4], 2)).toEqual([null, 1.5, 2.5, 3.5]);
    expect(rollingMean([1, 2, 3], 3)).toEqual([null, null, 2]);
  });

  it("an overflowing window is a gap, not ±Infinity", () => {
    expect(rollingMean([1e308, 1e308, 1e308], 3)).toEqual([null, null, null]);
  });

  it("co-plots two windows against a target", () => {
    const data = Array.from({ length: 40 }, (_, i) => 20 + Math.sin(i / 3) * 5);
    const geo = dualWindowGeometry({
      data,
      windows: [3, 30],
      target: 20,
      band: null,
      domain: null,
      width: 100,
      height: 24,
      gutter: 12,
    });
    expect(geo.fastPath).toContain("M");
    expect(geo.slowPath).toContain("M");
    expect(geo.fastLast).not.toBeNull();
    expect(geo.slowLast).not.toBeNull();
  });

  it("band renders a corridor rect", () => {
    const data = Array.from({ length: 40 }, (_, i) => 20 + Math.sin(i / 3) * 5);
    const geo = dualWindowGeometry({
      data,
      windows: [3, 30],
      target: 20,
      band: [18, 22],
      domain: null,
      width: 100,
      height: 24,
      gutter: 12,
    });
    expect(geo.bandRect).not.toBeNull();
    expect(geo.bandRect!.height).toBeGreaterThan(0);
  });

  // Hostile CONFIG: a host derives target/domain/band and hands over NaN.
  // Each of these painted NaN coordinates on an otherwise normal chart.
  describe("a non-finite config prop never reaches a coordinate", () => {
    const data = Array.from({ length: 40 }, (_, i) => 20 + Math.sin(i / 3) * 5);
    const geo = (over: Partial<Parameters<typeof dualWindowGeometry>[0]>) =>
      dualWindowGeometry({
        data,
        windows: [3, 30],
        target: 20,
        band: null,
        domain: null,
        width: 100,
        height: 24,
        gutter: 12,
        ...over,
      });

    it("drops the target line rather than placing it at NaN", () => {
      expect(geo({ target: Number.NaN }).targetY).toBeNull();
      expect(geo({ target: Infinity }).targetY).toBeNull();
      expect(geo({ target: undefined as unknown as number }).targetY).toBeNull();
      expect(geo({ target: 20 }).targetY).not.toBeNull();
    });

    it("ignores an unusable domain and auto-fits instead", () => {
      for (const domain of [
        [Number.NaN, Number.NaN],
        [-Infinity, Infinity],
        [0, Number.NaN],
      ] as const) {
        const g = geo({ domain });
        expect(`${g.fastPath}${g.slowPath}${g.targetY}`).not.toMatch(/NaN|Infinity/);
      }
    });

    // A FINITE domain can still overflow the subtraction: 1e308 − −1e308 is
    // Infinity, and Infinity/Infinity is NaN. Nothing downstream catches it.
    it("drops marks whose y overflows a finite domain", () => {
      const g = dualWindowGeometry({
        data: [1e308, 1e308, 1e308],
        windows: [1, 2],
        target: 1e308,
        band: [-1e308, 1e308],
        domain: [-1e308, 1e308],
        width: 100,
        height: 24,
        gutter: 12,
      });
      expect(g.fastPath).toBe("");
      expect(g.targetY).toBeNull();
      expect(g.bandRect).toBeNull();
      expect(g.fastLastY).toBeNull();
    });

    it("drops a half-finite corridor whole", () => {
      expect(geo({ band: [Number.NaN, 22] }).bandRect).toBeNull();
      expect(geo({ band: [-Infinity, Infinity] }).bandRect).toBeNull();
      expect(geo({ band: [18, 22] }).bandRect).not.toBeNull();
    });
  });

  test.prop([
    fc.array(fc.double({ min: -50, max: 50, noNaN: true }), { minLength: 1, maxLength: 100 }),
  ])("paths stay inside the plot", (data) => {
    const geo = dualWindowGeometry({
      data,
      windows: [3, 30],
      target: 0,
      band: null,
      domain: [-50, 50],
      width: 100,
      height: 24,
      gutter: 12,
    });
    for (const m of `${geo.fastPath}${geo.slowPath}`.matchAll(/[ML]([\d.]+) ([\d.]+)/g)) {
      expect(Number(m[1])).toBeLessThanOrEqual(88.01);
      expect(Number(m[2])).toBeGreaterThanOrEqual(-0.01);
      expect(Number(m[2])).toBeLessThanOrEqual(24.01);
    }
  });
});
