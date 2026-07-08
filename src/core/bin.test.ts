import { describe, it, expect } from "vitest";
import { test, fc } from "@fast-check/vitest";
import { uniformBins } from "./bin.js";

const finite = fc.double({ noNaN: true, noDefaultInfinity: true, min: -1e6, max: 1e6 });

describe("uniformBins (edge matrix)", () => {
  it("empty → null", () => expect(uniformBins([])).toBeNull());
  it("all-null → null", () => expect(uniformBins([null, null])).toBeNull());
  it("NaN/±Infinity → null when nothing finite", () => {
    expect(uniformBins([NaN, Infinity, -Infinity])).toBeNull();
  });

  it("all-equal → a single full-count bin, never twelve slivers", () => {
    const b = uniformBins([4, 4, 4, 4])!;
    expect(b.bins).toHaveLength(1);
    expect(b.bins[0]).toMatchObject({ x0: 4, x1: 4, count: 4, share: 1 });
    expect(b.step).toBe(0);
  });

  it("single value → one bin", () => {
    const b = uniformBins([7])!;
    expect(b.bins).toHaveLength(1);
    expect(b.total).toBe(1);
  });

  it("auto bin count = min(12, ceil(sqrt(n)), n)", () => {
    const many = Array.from({ length: 200 }, (_, i) => i);
    expect(uniformBins(many)!.bins).toHaveLength(12);
    expect(uniformBins([1, 2, 3, 4, 5, 6, 7, 8, 9])!.bins).toHaveLength(3);
    expect(uniformBins([1, 5])!.bins).toHaveLength(2);
  });

  it("explicit bins honored exactly (shared edges across small multiples)", () => {
    const b = uniformBins([0, 10], { bins: 5 })!;
    expect(b.bins).toHaveLength(5);
    expect(b.step).toBe(2);
  });

  it("domain fixes edges; outside values are not counted", () => {
    const b = uniformBins([-5, 0, 5, 15], { bins: 2, domain: [0, 10] })!;
    expect(b.total).toBe(2);
    expect(b.bins.map((x) => x.count)).toEqual([1, 1]); // 0 → [0,5), 5 → [5,10]
    expect(b.binOf(-5)).toBe(-1);
    expect(b.binOf(15)).toBe(-1);
  });

  it("reversed domain is normalized", () => {
    expect(uniformBins([5], { domain: [10, 0] })!.domain).toEqual([0, 10]);
  });

  it("value at the max lands in the top bin (closed last bin)", () => {
    const b = uniformBins([0, 10], { bins: 2 })!;
    expect(b.binOf(10)).toBe(1);
    expect(b.bins[1]!.count).toBe(1);
  });

  it("binOf rejects non-finite", () => {
    const b = uniformBins([0, 10])!;
    expect(b.binOf(NaN)).toBe(-1);
    expect(b.binOf(Infinity)).toBe(-1);
  });

  it("nulls ignored", () => {
    expect(uniformBins([null, 1, null, 9])!.total).toBe(2);
  });
});

describe("uniformBins (invariants)", () => {
  test.prop([fc.array(finite, { minLength: 1 }), fc.integer({ min: 1, max: 12 })])(
    "counts sum to total; shares sum to 1; every value lands in its bin",
    (xs, bins) => {
      const b = uniformBins(xs, { bins })!;
      const countSum = b.bins.reduce((a, x) => a + x.count, 0);
      expect(countSum).toBe(b.total);
      expect(b.total).toBe(xs.length);
      const shareSum = b.bins.reduce((a, x) => a + x.share, 0);
      expect(shareSum).toBeCloseTo(1, 6);
      const eps = Math.max(Math.abs(b.domain[0]), Math.abs(b.domain[1]), 1) * 1e-9;
      for (const v of xs) {
        const i = b.binOf(v);
        expect(i).toBeGreaterThanOrEqual(0);
        expect(v).toBeGreaterThanOrEqual(b.bins[i]!.x0 - eps);
        expect(v).toBeLessThanOrEqual(b.bins[i]!.x1 + eps);
      }
    },
  );

  test.prop([fc.array(finite, { minLength: 2 }), fc.integer({ min: 1, max: 12 })])(
    "bin edges tile the domain contiguously",
    (xs, bins) => {
      const b = uniformBins(xs, { bins })!;
      expect(b.bins[0]!.x0).toBe(b.domain[0]);
      expect(b.bins[b.bins.length - 1]!.x1).toBe(b.domain[1]);
      for (let i = 1; i < b.bins.length; i++) {
        expect(b.bins[i]!.x0).toBeCloseTo(b.bins[i - 1]!.x1, 9);
      }
    },
  );

  test.prop([fc.array(finite, { minLength: 1 })])("maxCount is the max bin count", (xs) => {
    const b = uniformBins(xs)!;
    expect(b.maxCount).toBe(Math.max(...b.bins.map((x) => x.count)));
  });
});
