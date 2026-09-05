import { describe, it, expect } from "vitest";
import { test, fc } from "@fast-check/vitest";
import { scaleLinear, clamp, extent, niceDomain } from "./scale.js";

const finite = fc.double({ noNaN: true, noDefaultInfinity: true, min: -1e6, max: 1e6 });

describe("scaleLinear", () => {
  test.prop([finite, finite, finite, finite])(
    "maps domain endpoints to range endpoints",
    (a, b, r0, r1) => {
      fc.pre(Math.abs(a - b) > 1);
      const s = scaleLinear([a, b], [r0, r1]);
      expect(s(a)).toBeCloseTo(r0, 3);
      expect(s(b)).toBeCloseTo(r1, 3);
    },
  );

  test.prop([finite, finite, finite, finite])(
    "maps the domain midpoint to the range midpoint",
    (a, b, r0, r1) => {
      fc.pre(Math.abs(a - b) > 1);
      const s = scaleLinear([a, b], [r0, r1]);
      expect(s((a + b) / 2)).toBeCloseTo((r0 + r1) / 2, 3);
    },
  );

  it("degenerate domain maps everything to the range midpoint", () => {
    const s = scaleLinear([5, 5], [0, 100]);
    expect(s(5)).toBe(50);
    expect(s(999)).toBe(50);
  });
});

describe("clamp", () => {
  test.prop([finite, finite, finite])("stays within bounds", (v, x, y) => {
    const min = Math.min(x, y);
    const max = Math.max(x, y);
    const c = clamp(v, min, max);
    expect(c).toBeGreaterThanOrEqual(min);
    expect(c).toBeLessThanOrEqual(max);
  });
});

describe("extent (edge matrix)", () => {
  it("empty → null", () => expect(extent([])).toBeNull());
  it("all-null → null", () => expect(extent([null, null])).toBeNull());
  it("NaN/Infinity ignored", () => {
    expect(extent([NaN, Infinity, -Infinity, 3, 7])).toEqual([3, 7]);
  });
  it("single", () => expect(extent([4])).toEqual([4, 4]));
  it("negatives", () => expect(extent([-5, -1, -9])).toEqual([-9, -1]));

  test.prop([fc.array(finite, { minLength: 1 })])("min ≤ max", (xs) => {
    const e = extent(xs)!;
    expect(e[0]).toBeLessThanOrEqual(e[1]);
  });
});

describe("niceDomain", () => {
  it("zero-anchors when requested", () => {
    expect(niceDomain([3, 8, 5], true)).toEqual([0, 8]);
    expect(niceDomain([-3, -8], true)).toEqual([-8, 0]);
  });
  it("pads a flat series", () => {
    const [lo, hi] = niceDomain([5, 5, 5]);
    expect(lo).toBeLessThan(5);
    expect(hi).toBeGreaterThan(5);
  });
  // The flat-pad branch ran before the zero anchor could apply, and for an
  // all-zero series it centred 0 instead of flooring it — a zero-anchored
  // sparkline fill drew its baseline across the midline.
  it("keeps zero on the floor for an all-zero series", () => {
    expect(niceDomain([0, 0, 0], true)).toEqual([0, 1]);
    expect(niceDomain([0, 0, 0])).toEqual([-1, 1]);
  });
  it("empty falls back to [0,1]", () => expect(niceDomain([])).toEqual([0, 1]));
});
