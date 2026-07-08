import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { computeFive, microBoxGeometry } from "./geometry.js";

const RAW = [12, 30, 35, 38, 42, 45, 48, 51, 60, 96];

describe("microBoxGeometry (plan/22 #16)", () => {
  it("box spans the IQR; median tick inside it; whiskers min-max by default", () => {
    const r = computeFive(RAW, undefined)!;
    const geo = microBoxGeometry({
      width: 40,
      height: 14,
      five: r.five,
      raw: r.raw,
      whiskers: "minmax",
    });
    expect(geo.box.x).toBeGreaterThan(geo.whisker.x0);
    expect(geo.box.x + geo.box.w).toBeLessThan(geo.whisker.x1);
    expect(geo.medianX).toBeGreaterThanOrEqual(geo.box.x);
    expect(geo.medianX).toBeLessThanOrEqual(geo.box.x + geo.box.w);
    expect(geo.outliers.length).toBe(0);
  });

  it("tukey exposes fence-breakers as dots (≤ 3/side, clipped counted)", () => {
    // 20 tight values keep the quartiles small; 5 extremes break the fence
    const tight = Array.from({ length: 20 }, (_, i) => 40 + i);
    const withOutliers = [...tight, 400, 500, 600, 700, 800];
    const r = computeFive(withOutliers, undefined)!;
    const geo = microBoxGeometry({
      width: 40,
      height: 14,
      five: r.five,
      raw: r.raw,
      whiskers: "tukey",
    });
    expect(geo.outliers.length).toBe(3); // cap per side
    expect(geo.clippedOutliers).toBe(2);
    // whisker retracts inside the fences
    expect(geo.whisker.x1).toBeLessThan(geo.statX.max);
  });

  it("degenerate IQR → box collapses to a ≥1-unit tick", () => {
    const r = computeFive([5, 5, 5, 5, 5, 1, 9], undefined)!;
    const geo = microBoxGeometry({
      width: 40,
      height: 14,
      five: r.five,
      raw: r.raw,
      whiskers: "minmax",
    });
    expect(geo.box.w).toBeGreaterThanOrEqual(1);
  });

  it("non-monotonic precomputed stats are refused", () => {
    expect(computeFive(undefined, { min: 5, q1: 3, median: 4, q3: 6, max: 7 })).toBeNull();
  });

  test.prop([
    fc.array(fc.double({ noNaN: true, min: -1e4, max: 1e4 }), { minLength: 5, maxLength: 60 }),
    fc.constantFrom<"minmax" | "tukey">("minmax", "tukey"),
  ])("containment: every mark inside the box", (values, whiskers) => {
    const r = computeFive(values, undefined);
    if (!r) return;
    const geo = microBoxGeometry({ width: 40, height: 14, five: r.five, raw: r.raw, whiskers });
    for (const v of [
      geo.whisker.x0,
      geo.whisker.x1,
      geo.medianX,
      geo.box.x,
      geo.box.x + geo.box.w,
    ]) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(40.01);
    }
    expect(geo.box.y).toBeGreaterThanOrEqual(0);
    expect(geo.box.y + geo.box.h).toBeLessThanOrEqual(14.01);
    for (const o of geo.outliers) {
      expect(o.x).toBeGreaterThanOrEqual(0);
      expect(o.x).toBeLessThanOrEqual(40.01);
    }
  });
});
