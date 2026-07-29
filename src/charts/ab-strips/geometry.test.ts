import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { abStripsGeometry, abTagChars } from "./geometry.js";

const base = { width: 80, height: 20 };
const A = Array.from({ length: 60 }, (_, i) => 120 + (i % 20) - 8 + (i % 3) * 4);
const B = Array.from({ length: 60 }, (_, i) => 110 + (i % 20) - 8 + (i % 3) * 4);

describe("abStripsGeometry", () => {
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

  it("announced medians stay finite past round2's ×100 headroom", () => {
    // round2 multiplies by 100 first, so a finite 1e307 came back ±Infinity:
    // the summary read "median ∞" over a normally painted strip and the delta
    // gutter printed "NaN%" (∞ ÷ ∞).
    const geo = abStripsGeometry({ ...base, a: [1e307, 2e307], b: [-1e307, 3e307] })!;
    for (const n of [geo.aMedian, geo.bMedian, geo.deltaMedian]) expect(n).toBeTypeOf("number");
    expect(Number.isFinite(geo.aMedian)).toBe(true);
    expect(Number.isFinite(geo.bMedian)).toBe(true);
    expect(Number.isFinite(geo.deltaMedian)).toBe(true);
    for (const r of geo.rows) for (const e of r.edges) expect(Number.isFinite(e.value)).toBe(true);
  });
});

describe("abTagChars gates the row tags on BOTH axes", () => {
  const tags = (o: Partial<Parameters<typeof abTagChars>[0]>) =>
    abTagChars({ width: 80, height: 20, fontSize: 7, labels: ["A", "B"], ...o });

  it("keeps short tags, and reports the longer identity's length", () => {
    expect(tags({})).toBe(1);
    expect(tags({ labels: ["Ctrl", "Test"] })).toBe(4);
  });

  it("drops them below one em of row pitch", () => {
    expect(tags({ height: 17 })).toBe(0);
  });

  it("drops them when their gutter would claim most of the width", () => {
    expect(tags({ labels: ["Control group", "Treatment"] })).toBe(0);
    // same identities, four times the room → they fit again
    expect(tags({ width: 320, labels: ["Control group", "Treatment"] })).toBe(13);
  });
});

describe("abStripsGeometry caps the tag gutter", () => {
  it("a caller that skipped the gate still gets marks inside the box", () => {
    // An uncapped lead crosses `width - pad`, which inverts scaleLinear's range
    // and makes clamp pin every x at the lead itself — x=135 in a 108-wide
    // viewBox, outside a root that is `overflow: visible`.
    const geo = abStripsGeometry({ ...base, a: A, b: B, labelChars: 20, fontSize: 11 })!;
    for (const r of geo.rows) {
      expect(r.outer.x).toBeGreaterThanOrEqual(0);
      expect(r.outer.x + r.outer.width).toBeLessThanOrEqual(base.width);
      expect(r.median.x).toBeLessThanOrEqual(base.width);
    }
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
