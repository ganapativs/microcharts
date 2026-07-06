import { describe, it, expect } from "vitest";
import { test, fc } from "@fast-check/vitest";
import { seriesStats } from "./stats.js";
import { isFiniteValue, type Value } from "./types.js";

const finite = fc.double({ noNaN: true, noDefaultInfinity: true, min: -1e6, max: 1e6 });
const value: fc.Arbitrary<Value> = fc.oneof(finite, fc.constant(null));

describe("seriesStats (edge matrix)", () => {
  it("empty → null", () => expect(seriesStats([])).toBeNull());
  it("all-null → null", () => expect(seriesStats([null, null, null])).toBeNull());
  it("NaN/±Infinity → null when nothing finite", () => {
    expect(seriesStats([NaN, Infinity, -Infinity])).toBeNull();
  });

  it("single finite value", () => {
    const s = seriesStats([7])!;
    expect(s).toMatchObject({ count: 1, min: 7, max: 7, first: 7, last: 7, delta: 0, trend: 0 });
  });

  it("all-equal → flat, trend 0", () => {
    const s = seriesStats([4, 4, 4])!;
    expect(s.min).toBe(s.max);
    expect(s.trend).toBe(0);
    expect(s.delta).toBe(0);
  });

  it("indices point into the ORIGINAL array (gaps preserved)", () => {
    const s = seriesStats([null, 3, null, 9, 1])!;
    expect(s.firstIndex).toBe(1);
    expect(s.lastIndex).toBe(4);
    expect(s.maxIndex).toBe(3);
    expect(s.minIndex).toBe(4);
  });

  it("negatives + up/down trend", () => {
    expect(seriesStats([-5, -1])!.trend).toBe(1);
    expect(seriesStats([2, -3])!.trend).toBe(-1);
  });

  it("deltaRatio guards first === 0", () => {
    expect(seriesStats([0, 5])!.deltaRatio).toBe(0);
  });
});

describe("seriesStats (invariants)", () => {
  test.prop([fc.array(value)])("min ≤ mean ≤ max; count matches finite", (xs) => {
    const s = seriesStats(xs);
    const finiteVals = xs.filter(isFiniteValue);
    if (finiteVals.length === 0) {
      expect(s).toBeNull();
      return;
    }
    expect(s!.count).toBe(finiteVals.length);
    expect(s!.min).toBeLessThanOrEqual(s!.mean);
    expect(s!.mean).toBeLessThanOrEqual(s!.max);
    expect(s!.delta).toBeCloseTo(s!.last - s!.first, 6);
  });
});
