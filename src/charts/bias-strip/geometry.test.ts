import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { biasStripGeometry } from "./geometry.js";

const base = { width: 56, height: 30, limits: 1.96, rad: 1.8 };

// a clean paired set with a known +2 offset (b runs 2 below a)
const OFFSET = Array.from({ length: 12 }, (_, i) => ({ a: i + 2, b: i }));

describe("biasStripGeometry", () => {
  it("bias is the mean difference; band + limits appear at n ≥ 5", () => {
    const geo = biasStripGeometry({ ...base, data: OFFSET });
    expect(geo.bias).toBe(2);
    expect(geo.band).not.toBeNull();
    expect(geo.biasY).not.toBeNull();
    expect(geo.withinPct).not.toBeNull();
    expect(geo.n).toBe(12);
  });

  it("fewer than 5 pairs → dots only, no band or limits (micro-box precedent)", () => {
    const geo = biasStripGeometry({ ...base, data: OFFSET.slice(0, 4) });
    expect(geo.band).toBeNull();
    expect(geo.biasY).toBeNull();
    expect(geo.withinPct).toBeNull();
    expect(geo.bias).toBe(2); // the mean difference is still reported
  });

  it("perfect agreement → bias 0, limits collapse to a hair-thin band", () => {
    const geo = biasStripGeometry({
      ...base,
      data: Array.from({ length: 6 }, (_, i) => ({ a: i, b: i })),
    });
    expect(geo.bias).toBe(0);
    expect(geo.band).not.toBeNull();
    expect(geo.band!.height).toBe(0.75); // collapsed band ⇒ sd 0
    expect(geo.withinPct).toBe(100);
  });

  it("within-limits share counts the finite pairs inside the band", () => {
    // 9 tight pairs (diff 0) + 1 gross outlier → far outside the ±1.96σ band
    const data = [...Array.from({ length: 9 }, () => ({ a: 10, b: 10 })), { a: 100, b: 0 }];
    const geo = biasStripGeometry({ ...base, data });
    expect(geo.dots.find((d) => d.outside)).toBeTruthy();
    expect(geo.withinPct).toBe(90);
  });

  it("non-finite pairs are dropped and counted", () => {
    const geo = biasStripGeometry({
      ...base,
      data: [
        { a: 1, b: 2 },
        { a: Number.NaN, b: 3 },
        { a: 4, b: Number.POSITIVE_INFINITY },
      ],
    });
    expect(geo.dots.length).toBe(1);
    expect(geo.n).toBe(1); // 2 non-finite pairs dropped from 3 inputs
  });

  it("> 40 pairs → dots downsampled for display, stats over every pair", () => {
    const data = Array.from({ length: 100 }, (_, i) => ({ a: i + 2, b: i }));
    const geo = biasStripGeometry({ ...base, data });
    expect(geo.dots.length).toBe(40);
    expect(geo.n).toBe(100); // bias/limits still use all 100
    expect(geo.bias).toBe(2);
  });

  test.prop([
    fc.array(
      fc.record({
        a: fc.double({ min: -1e4, max: 1e4 }),
        b: fc.double({ min: -1e4, max: 1e4 }),
      }),
      { maxLength: 80 },
    ),
    fc.double({ min: 1, max: 3 }),
  ])("dots + band stay inside the plot; withinPct ∈ [0, 100]", (data, k) => {
    const geo = biasStripGeometry({ ...base, data, limits: k });
    for (const d of geo.dots) {
      expect(d.x).toBeGreaterThanOrEqual(0);
      expect(d.x).toBeLessThanOrEqual(56);
      expect(d.y).toBeGreaterThanOrEqual(0);
      expect(d.y).toBeLessThanOrEqual(30);
    }
    if (geo.band) {
      expect(geo.band.y).toBeGreaterThanOrEqual(0);
      expect(geo.band.y + geo.band.height).toBeLessThanOrEqual(30.01);
    }
    if (geo.withinPct !== null) {
      expect(geo.withinPct).toBeGreaterThanOrEqual(0);
      expect(geo.withinPct).toBeLessThanOrEqual(100);
    }
    expect(geo.dots.length).toBeLessThanOrEqual(40);
  });
});
