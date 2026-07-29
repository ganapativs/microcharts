import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { computeFive, microBoxDots, microBoxGeometry } from "./geometry.js";

const RAW = [12, 30, 35, 38, 42, 45, 48, 51, 60, 96];

describe("microBoxGeometry", () => {
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

  it("the box never outgrows a short frame", () => {
    // Regression: the 4-unit readability floor on the box height was applied
    // unconditionally, so below height 4 the box spilled above and below the
    // viewBox (`.mc-root` is overflow: visible — nothing clips it).
    const r = computeFive(RAW, undefined)!;
    for (const height of [1, 2, 3, 4, 6, 8, 14, 32]) {
      const geo = microBoxGeometry({
        width: 40,
        height,
        five: r.five,
        raw: r.raw,
        whiskers: "minmax",
      });
      expect(geo.box.y).toBeGreaterThanOrEqual(0);
      expect(geo.box.y + geo.box.h).toBeLessThanOrEqual(height + 0.01);
    }
  });

  it("keeps the 4-unit box floor at every height it ships at", () => {
    const r = computeFive(RAW, undefined)!;
    const at = (height: number) =>
      microBoxGeometry({ width: 40, height, five: r.five, raw: r.raw, whiskers: "minmax" }).box.h;
    expect(at(14)).toBe(9);
    expect(at(32)).toBe(27);
    expect(at(8)).toBe(4); // short frame still gets the readable floor
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

// Regression: the small-n dot path once carried its own [min,max] → [1.5,w-1.5]
// scale while the interactive hit-tested `microBoxGeometry`, so the painted dots
// and the stat crosshair lived in two different spaces — they agreed only when
// `domain` happened to equal the extent.
describe("microBoxDots (fewer than 5 observations)", () => {
  it("dots and stat stops share one scale", () => {
    const r = computeFive([1, 2, 3], undefined)!;
    const { dots, statX } = microBoxDots({ raw: r.raw, width: 40, five: r.five, domain: [0, 10] });
    expect(statX.min).toBe(dots[0]);
    expect(statX.median).toBe(dots[1]);
    expect(statX.max).toBe(dots[2]);
  });

  it("honours an explicit domain instead of stretching to the extent", () => {
    const r = computeFive([1, 2, 3], undefined)!;
    // 1..3 of a 0..10 domain occupies the left third, not the full width
    const wide = microBoxDots({ raw: r.raw, width: 40, five: r.five, domain: [0, 10] });
    expect(wide.dots[0]).toBeCloseTo(5.2, 1);
    expect(wide.dots[2]).toBeCloseTo(12.6, 1);
    // ...and with no domain it does span the box
    const bare = microBoxDots({ raw: r.raw, width: 40, five: r.five });
    expect(bare.dots[0]).toBeCloseTo(1.5, 1);
    expect(bare.dots[2]).toBeCloseTo(38.5, 1);
  });

  it("all-equal values sit at centre, not pinned to the left edge", () => {
    const r = computeFive([7, 7, 7], undefined)!;
    // degenerate domain widens to [6,8] → every mark lands mid-box
    const { dots, statX } = microBoxDots({ raw: r.raw, width: 40, five: r.five });
    expect(dots).toEqual([20, 20, 20]);
    expect(statX.min).toBe(20);
    expect(statX.max).toBe(20);
  });

  it("agrees with the box path's stat stops on the same domain", () => {
    const r = computeFive([1, 2, 3], undefined)!;
    const dots = microBoxDots({ raw: r.raw, width: 40, five: r.five, domain: [0, 10] });
    const box = microBoxGeometry({
      width: 40,
      height: 14,
      five: r.five,
      raw: r.raw,
      whiskers: "minmax",
      domain: [0, 10],
    });
    expect(dots.statX).toEqual(box.statX);
  });
});
