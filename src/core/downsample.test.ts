import { describe, it, expect } from "vitest";
import { test, fc } from "@fast-check/vitest";
import { maxPerBucket, envelope } from "./downsample.js";
import { isFiniteValue, type Value } from "./types.js";

const finite = fc.double({ noNaN: true, noDefaultInfinity: true, min: -1e6, max: 1e6 });
const value: fc.Arbitrary<Value> = fc.oneof(finite, fc.constant(null));

describe("maxPerBucket (edge matrix)", () => {
  it("empty → empty", () => expect(maxPerBucket([], 8)).toEqual([]));
  it("buckets < 1 → empty", () => expect(maxPerBucket([1, 2], 0)).toEqual([]));

  it("buckets ≥ length → plain copy (non-finite normalized to null)", () => {
    expect(maxPerBucket([1, null, NaN, 4], 10)).toEqual([1, null, null, 4]);
  });

  it("keeps the max per bucket, never the mean", () => {
    // 8 values → 2 buckets of 4; means would be 2.5 and 62.5
    expect(maxPerBucket([1, 2, 3, 4, 100, 50, 50, 50], 2)).toEqual([4, 100]);
  });

  it("a single spike among zeros survives", () => {
    const values = Array.from({ length: 100 }, () => 0);
    values[37] = 9;
    expect(maxPerBucket(values, 10)).toContain(9);
  });

  it("all-null buckets emit null (gaps stay gaps)", () => {
    expect(maxPerBucket([null, null, 1, 2], 2)).toEqual([null, 2]);
  });

  it("abs keeps the value farthest from zero, sign preserved", () => {
    expect(maxPerBucket([-10, 3], 1, { abs: true })).toEqual([-10]);
    expect(maxPerBucket([-2, 5], 1, { abs: true })).toEqual([5]);
  });

  it("all-equal stays flat", () => {
    expect(maxPerBucket([4, 4, 4, 4], 2)).toEqual([4, 4]);
  });
});

describe("maxPerBucket (invariants)", () => {
  test.prop([fc.array(value, { minLength: 1 }), fc.integer({ min: 1, max: 64 })])(
    "the global max ALWAYS survives downsampling",
    (xs, buckets) => {
      const finiteVals = xs.filter(isFiniteValue);
      const out = maxPerBucket(xs, buckets);
      if (finiteVals.length === 0) {
        expect(out.every((v) => v === null)).toBe(true);
        return;
      }
      expect(out).toContain(Math.max(...finiteVals));
    },
  );

  test.prop([fc.array(value, { minLength: 1 }), fc.integer({ min: 1, max: 64 })])(
    "abs mode: the global absolute max survives",
    (xs, buckets) => {
      const finiteVals = xs.filter(isFiniteValue);
      fc.pre(finiteVals.length > 0);
      const out = maxPerBucket(xs, buckets, { abs: true });
      const peak = finiteVals.reduce((a, b) => (Math.abs(b) > Math.abs(a) ? b : a));
      expect(out.map((v) => (v === null ? null : Math.abs(v)))).toContain(Math.abs(peak));
    },
  );

  test.prop([fc.array(value), fc.integer({ min: 1, max: 64 })])(
    "output length = min(buckets, length); every value comes from the input",
    (xs, buckets) => {
      const out = maxPerBucket(xs, buckets);
      expect(out).toHaveLength(Math.min(buckets, xs.length));
      for (const v of out) {
        if (v !== null) expect(xs).toContain(v);
      }
    },
  );
});

describe("envelope (edge matrix)", () => {
  it("empty → empty", () => expect(envelope([], 4)).toEqual({ min: [], max: [] }));
  it("buckets < 1 → empty", () => expect(envelope([1], 0)).toEqual({ min: [], max: [] }));

  it("buckets ≥ length → copy on both sides", () => {
    expect(envelope([1, null, 3], 8)).toEqual({ min: [1, null, 3], max: [1, null, 3] });
  });

  it("min and max per bucket", () => {
    expect(envelope([1, 9, -4, 2], 2)).toEqual({ min: [1, -4], max: [9, 2] });
  });

  it("all-null bucket → null on both sides", () => {
    expect(envelope([null, null, 5, 6], 2)).toEqual({ min: [null, 5], max: [null, 6] });
  });
});

describe("envelope (invariants)", () => {
  test.prop([fc.array(value, { minLength: 1 }), fc.integer({ min: 1, max: 64 })])(
    "min ≤ max per bucket; global extremes both survive",
    (xs, buckets) => {
      const { min, max } = envelope(xs, buckets);
      expect(min).toHaveLength(max.length);
      for (let i = 0; i < min.length; i++) {
        if (min[i] !== null) expect(min[i]!).toBeLessThanOrEqual(max[i]!);
        expect(min[i] === null).toBe(max[i] === null);
      }
      const finiteVals = xs.filter(isFiniteValue);
      if (finiteVals.length > 0) {
        expect(min).toContain(Math.min(...finiteVals));
        expect(max).toContain(Math.max(...finiteVals));
      }
    },
  );

  test.prop([fc.array(value, { minLength: 1 }), fc.integer({ min: 1, max: 64 })])(
    "envelope max agrees with maxPerBucket",
    (xs, buckets) => {
      expect(envelope(xs, buckets).max).toEqual(maxPerBucket(xs, buckets));
    },
  );
});
