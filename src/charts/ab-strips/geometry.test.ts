import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { abStripsGeometry } from "./geometry.js";

const base = { width: 80, height: 20 };
const A = Array.from({ length: 60 }, (_, i) => 120 + (i % 20) - 8 + (i % 3) * 4);
const B = Array.from({ length: 60 }, (_, i) => 110 + (i % 20) - 8 + (i % 3) * 4);

describe("abStripsGeometry (plan/23 #13)", () => {
  it("two rows on one shared scale; medians + delta", () => {
    const geo = abStripsGeometry({ ...base, a: A, b: B })!;
    expect(geo.rows).toHaveLength(2);
    expect(geo.deltaMedian).toBe(round(geo.bMedian - geo.aMedian));
    // B lower than A here → negative delta
    expect(geo.deltaMedian).toBeLessThan(0);
  });

  it("overlap is a 0–1 fraction of the smaller middle half", () => {
    const geo = abStripsGeometry({ ...base, a: A, b: B })!;
    expect(geo.overlap).toBeGreaterThanOrEqual(0);
    expect(geo.overlap).toBeLessThanOrEqual(1);
  });

  it("identical samples → overlap 1, delta 0", () => {
    const geo = abStripsGeometry({ ...base, a: A, b: A })!;
    expect(geo.overlap).toBe(1);
    expect(geo.deltaMedian).toBe(0);
  });

  it("disjoint middle halves → overlap 0", () => {
    const lo = Array.from({ length: 40 }, (_, i) => 10 + (i % 5));
    const hi = Array.from({ length: 40 }, (_, i) => 90 + (i % 5));
    const geo = abStripsGeometry({ ...base, a: lo, b: hi })!;
    expect(geo.overlap).toBe(0);
  });

  it("small n (< 8) → that row uses min–max as the outer band", () => {
    const geo = abStripsGeometry({ ...base, a: [100, 130, 145], b: B })!;
    expect(geo.rows[0]!.small).toBe(true);
    expect(geo.rows[1]!.small).toBe(false);
    expect(geo.na).toBe(3);
  });

  it("inner (p25–75) sits inside outer (p5–95)", () => {
    const geo = abStripsGeometry({ ...base, a: A, b: B })!;
    for (const r of geo.rows) {
      expect(r.inner.x).toBeGreaterThanOrEqual(r.outer.x - 0.01);
      expect(r.inner.x + r.inner.width).toBeLessThanOrEqual(r.outer.x + r.outer.width + 0.01);
    }
  });

  it("empty arm → null", () => {
    expect(abStripsGeometry({ ...base, a: [], b: B })).toBeNull();
  });

  test.prop([
    fc.array(fc.double({ noNaN: true, min: 0, max: 1e3 }), { minLength: 1, maxLength: 50 }),
    fc.array(fc.double({ noNaN: true, min: 0, max: 1e3 }), { minLength: 1, maxLength: 50 }),
  ])("containment: bands inside the plot", (a, b) => {
    const geo = abStripsGeometry({ ...base, a, b, gutterCh: 4, fontSize: 8 });
    if (!geo) return;
    for (const r of geo.rows) {
      expect(r.outer.x).toBeGreaterThanOrEqual(-0.01);
      expect(r.outer.x + r.outer.width).toBeLessThanOrEqual(80.01);
      expect(r.y).toBeGreaterThanOrEqual(1.99);
      expect(r.y).toBeLessThanOrEqual(18.01);
    }
  });
});

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
