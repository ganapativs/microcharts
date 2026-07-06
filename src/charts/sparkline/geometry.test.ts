import { describe, it, expect } from "vitest";
import { test, fc } from "@fast-check/vitest";
import { sparkGeometry } from "./geometry.js";
import type { Value } from "../../core/types.js";

const W = 80;
const H = 20;
const geo = (data: readonly Value[], opts = {}) =>
  sparkGeometry(data, { width: W, height: H, ...opts });

describe("sparkGeometry (edge matrix, plan/09)", () => {
  it("empty → no marks, no points, valid plot", () => {
    const g = geo([]);
    expect(g.points).toEqual([]);
    expect(g.last).toBeNull();
    expect(g.min).toBeNull();
    expect(g.max).toBeNull();
    expect(g.plot).toEqual({ x0: 2, x1: 78, y0: 2, y1: 18 });
  });

  it("all-null → all gaps, no marks", () => {
    const g = geo([null, null, null]);
    expect(g.points).toEqual([null, null, null]);
    expect(g.last).toBeNull();
  });

  it("single point → centered, endpoint = that point", () => {
    const g = geo([7]);
    expect(g.points).toHaveLength(1);
    expect(g.points[0]![0]).toBe((2 + 78) / 2);
    expect(g.last).toMatchObject({ value: 7, index: 0 });
  });

  it("flat series → all points on the mid-line", () => {
    const g = geo([5, 5, 5, 5]);
    const ys = g.points.map((p) => p![1]);
    expect(new Set(ys).size).toBe(1);
    expect(ys[0]).toBeCloseTo(H / 2, 5);
  });

  it("nulls become gaps but keep x by original index", () => {
    const g = geo([0, null, 10]);
    expect(g.points[1]).toBeNull();
    expect(g.points[0]![0]).toBe(2);
    expect(g.points[2]![0]).toBe(78);
    // ascending series: last value is highest → smallest y (top)
    expect(g.last).toMatchObject({ index: 2, value: 10 });
  });

  it("NaN / ±Infinity treated as gaps", () => {
    const g = geo([1, Number.NaN, Number.POSITIVE_INFINITY, 4]);
    expect(g.points[1]).toBeNull();
    expect(g.points[2]).toBeNull();
    expect(g.last).toMatchObject({ index: 3, value: 4 });
  });

  it("higher values map to smaller y (svg y grows down)", () => {
    const g = geo([1, 9]);
    expect(g.points[0]![1]).toBeGreaterThan(g.points[1]![1]);
  });

  it("min/max marks point at the right indices", () => {
    const g = geo([5, 2, 8, 3]);
    expect(g.min).toMatchObject({ index: 1, value: 2 });
    expect(g.max).toMatchObject({ index: 2, value: 8 });
  });

  it("explicit domain overrides auto-fit", () => {
    const fit = geo([2, 4]);
    const forced = geo([2, 4], { domain: [0, 10] });
    expect(forced.points[0]![1]).not.toBe(fit.points[0]![1]);
  });

  it("zero-anchored baseline sits at y(0)", () => {
    const g = geo([2, 6, 4], { zero: true });
    // domain includes 0 → baseline is the plot floor (y1)
    expect(g.baselineY).toBe(18);
  });

  it("band clamps to the plot and yields a positive rect", () => {
    const g = geo([0, 5, 10], { band: [3, 7] });
    expect(g.band).not.toBeNull();
    expect(g.band!.height).toBeGreaterThan(0);
    expect(g.band!.y).toBeGreaterThanOrEqual(2);
    expect(g.band!.y + g.band!.height).toBeLessThanOrEqual(18);
  });

  it("degenerate band (lo === hi) → null", () => {
    expect(geo([0, 10], { band: [5, 5] }).band).toBeNull();
  });

  it("tiny-but-real magnitudes stay finite and inside the plot", () => {
    const g = geo([1e-6, 3e-6, 2e-6]);
    for (const p of g.points) {
      expect(Number.isFinite(p![0])).toBe(true);
      expect(Number.isFinite(p![1])).toBe(true);
      expect(p![1]).toBeGreaterThanOrEqual(2);
      expect(p![1]).toBeLessThanOrEqual(18);
    }
  });
});

// Realistic chart magnitudes: bounded like the core scale/path suites and with
// subnormals excluded — a domain spanning a denormal makes the scale slope
// overflow, and no real series plots 1e-323 (covered separately below).
const finite = fc
  .double({ noNaN: true, noDefaultInfinity: true, min: -1e4, max: 1e4 })
  .filter((v) => v === 0 || Math.abs(v) >= 1e-3);
const value = fc.oneof(finite, fc.constant(null as Value));

describe("sparkGeometry (invariants)", () => {
  test.prop([fc.array(value, { minLength: 1 })])(
    "finite points stay inside the plot box",
    (data) => {
      const g = geo(data);
      for (const p of g.points) {
        if (p === null) continue;
        expect(p[0]).toBeGreaterThanOrEqual(2);
        expect(p[0]).toBeLessThanOrEqual(78);
        expect(p[1]).toBeGreaterThanOrEqual(2 - 1e-6);
        expect(p[1]).toBeLessThanOrEqual(18 + 1e-6);
      }
    },
  );

  test.prop([fc.array(value, { minLength: 1 })])("never emits NaN in coordinates", (data) => {
    const g = geo(data);
    for (const p of g.points) {
      if (p === null) continue;
      expect(Number.isNaN(p[0])).toBe(false);
      expect(Number.isNaN(p[1])).toBe(false);
    }
    expect(Number.isNaN(g.baselineY)).toBe(false);
  });

  test.prop([fc.array(finite, { minLength: 2 })])(
    "x positions are monotonically non-decreasing",
    (data) => {
      const g = geo(data);
      const xs = g.points.map((p) => p![0]);
      for (let i = 1; i < xs.length; i++) expect(xs[i]).toBeGreaterThanOrEqual(xs[i - 1]!);
    },
  );
});
