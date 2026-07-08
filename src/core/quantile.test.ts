import { describe, it, expect } from "vitest";
import { test, fc } from "@fast-check/vitest";
import { quantiles, fiveNumber, quantileDotplot } from "./quantile.js";
import { type Value } from "./types.js";

const finite = fc.double({ noNaN: true, noDefaultInfinity: true, min: -1e6, max: 1e6 });
const value: fc.Arbitrary<Value> = fc.oneof(finite, fc.constant(null));

describe("quantiles (edge matrix)", () => {
  it("empty → null", () => expect(quantiles([], [0.5])).toBeNull());
  it("all-null → null", () => expect(quantiles([null, null], [0.5])).toBeNull());
  it("NaN/±Infinity → null when nothing finite", () => {
    expect(quantiles([NaN, Infinity, -Infinity], [0.5])).toBeNull();
  });

  it("single value → every quantile is that value", () => {
    expect(quantiles([7], [0, 0.25, 0.5, 1])).toEqual([7, 7, 7, 7]);
  });

  it("all-equal → flat quantiles", () => {
    expect(quantiles([4, 4, 4], [0.1, 0.9])).toEqual([4, 4]);
  });

  it("R-7 interpolation on a known series", () => {
    // [1..4]: q1 = 1.75, median = 2.5, q3 = 3.25
    expect(quantiles([1, 2, 3, 4], [0.25, 0.5, 0.75])).toEqual([1.75, 2.5, 3.25]);
  });

  it("nulls ignored, order irrelevant", () => {
    expect(quantiles([null, 9, 1, null, 5], [0.5])).toEqual([5]);
  });

  it("p outside [0,1] clamps; NaN p → NaN out", () => {
    expect(quantiles([1, 2, 3], [-1, 2])).toEqual([1, 3]);
    expect(quantiles([1, 2, 3], [NaN])![0]).toBeNaN();
  });
});

describe("quantiles (invariants)", () => {
  test.prop([
    fc.array(finite, { minLength: 1 }),
    fc.array(fc.double({ min: 0, max: 1, noNaN: true })),
  ])("monotone in p and bounded by min/max", (xs, ps) => {
    const sortedPs = [...ps].sort((a, b) => a - b);
    const qs = quantiles(xs, sortedPs)!;
    const lo = Math.min(...xs);
    const hi = Math.max(...xs);
    for (let i = 0; i < qs.length; i++) {
      expect(qs[i]).toBeGreaterThanOrEqual(lo);
      expect(qs[i]).toBeLessThanOrEqual(hi);
      if (i > 0) expect(qs[i]).toBeGreaterThanOrEqual(qs[i - 1]!);
    }
  });

  test.prop([fc.array(finite, { minLength: 1 })])("p=0 → min, p=1 → max", (xs) => {
    const [q0, q1] = quantiles(xs, [0, 1])!;
    // + 0 normalizes -0 (interpolation arithmetic legitimately yields +0)
    expect(q0! + 0).toBe(Math.min(...xs) + 0);
    expect(q1! + 0).toBe(Math.max(...xs) + 0);
  });
});

describe("fiveNumber", () => {
  it("empty → null", () => expect(fiveNumber([])).toBeNull());
  it("single value collapses all five", () => {
    expect(fiveNumber([3])).toEqual({ min: 3, q1: 3, median: 3, q3: 3, max: 3 });
  });
  it("known series", () => {
    expect(fiveNumber([1, 2, 3, 4])).toEqual({ min: 1, q1: 1.75, median: 2.5, q3: 3.25, max: 4 });
  });

  test.prop([fc.array(value, { minLength: 1 })])("ordered min ≤ q1 ≤ median ≤ q3 ≤ max", (xs) => {
    const f = fiveNumber(xs);
    if (f === null) return;
    expect(f.min).toBeLessThanOrEqual(f.q1);
    expect(f.q1).toBeLessThanOrEqual(f.median);
    expect(f.median).toBeLessThanOrEqual(f.q3);
    expect(f.q3).toBeLessThanOrEqual(f.max);
  });
});

describe("quantileDotplot", () => {
  it("empty → null", () => expect(quantileDotplot([], 20)).toBeNull());
  it("all-null → null", () => expect(quantileDotplot([null, null], 20)).toBeNull());

  it("all-equal → one column stacking every dot", () => {
    const d = quantileDotplot([5, 5, 5], 20)!;
    expect(d.columns).toBe(1);
    expect(d.binWidth).toBe(0);
    expect(d.maxStack).toBe(20);
    expect(d.dots).toHaveLength(20);
    expect(d.dots.every((dot) => dot.column === 0 && dot.value === 5)).toBe(true);
  });

  it("default count is 20, default bins is count/2", () => {
    const d = quantileDotplot([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])!;
    expect(d.dots).toHaveLength(20);
    expect(d.columns).toBe(10);
  });

  it("rows stack bottom-up per column (0, 1, 2, …)", () => {
    const d = quantileDotplot([1, 2, 3, 4, 5, 6, 7, 8], 12, 4)!;
    const perColumn = new Map<number, number[]>();
    for (const dot of d.dots) {
      const rows = perColumn.get(dot.column) ?? [];
      rows.push(dot.row);
      perColumn.set(dot.column, rows);
    }
    for (const rows of perColumn.values()) {
      expect(rows).toEqual(rows.map((_, i) => i));
    }
  });

  test.prop([fc.array(finite, { minLength: 1 }), fc.integer({ min: 1, max: 25 })])(
    "emits exactly count dots, columns in range, values within data extent",
    (xs, count) => {
      const d = quantileDotplot(xs, count)!;
      expect(d.dots).toHaveLength(count);
      const lo = Math.min(...xs);
      const hi = Math.max(...xs);
      for (const dot of d.dots) {
        expect(dot.column).toBeGreaterThanOrEqual(0);
        expect(dot.column).toBeLessThan(d.columns);
        expect(dot.value).toBeGreaterThanOrEqual(lo);
        expect(dot.value).toBeLessThanOrEqual(hi);
      }
    },
  );

  test.prop([fc.array(finite, { minLength: 2 }), fc.integer({ min: 2, max: 25 })])(
    "maxStack matches the tallest column and stacks sum to count",
    (xs, count) => {
      const d = quantileDotplot(xs, count)!;
      const stacks = Array.from({ length: d.columns }, () => 0);
      for (const dot of d.dots) stacks[dot.column]!++;
      expect(Math.max(...stacks)).toBe(d.maxStack);
      expect(stacks.reduce((a, b) => a + b, 0)).toBe(count);
    },
  );

  test.prop([fc.array(finite, { minLength: 1 }), fc.integer({ min: 1, max: 25 })])(
    "deterministic: same input → same layout",
    (xs, count) => {
      expect(quantileDotplot(xs, count)).toEqual(quantileDotplot(xs, count));
    },
  );
});
