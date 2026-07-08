import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { controlGeometry } from "./geometry.js";

const base = { width: 80, height: 16 };
// 12 in-control points around 10, then a spike to 16 (out)
const SAMPLE = [10, 11, 9, 10, 11, 9, 10, 10, 11, 9, 10, 16];

describe("controlGeometry (plan/23 #10)", () => {
  it("σ̂ = mean moving range / 1.128 (individuals estimator, not sample SD)", () => {
    // data with a constant moving range of 2 → MR̄ = 2 → σ̂ = 2/1.128 ≈ 1.773
    const geo = controlGeometry({ ...base, data: [10, 12, 10, 12, 10, 12, 10, 12, 10, 12] })!;
    // center 11, ±3σ̂ ≈ 11 ± 5.32 → [5.68, 16.32]
    expect(geo.center.value).toBe(11);
    expect(geo.band.lo).toBeCloseTo(5.68, 1);
    expect(geo.band.hi).toBeCloseTo(16.32, 1);
  });

  it("marks only out-of-control points (in-control look boring)", () => {
    const geo = controlGeometry({ ...base, data: SAMPLE })!;
    const outIdx = geo.points.map((p, i) => (p.out ? i : -1)).filter((i) => i >= 0);
    expect(outIdx).toEqual([11]); // only the spike to 16
  });

  it("WE-1 violation recorded for every out point (always on)", () => {
    const geo = controlGeometry({ ...base, data: SAMPLE })!;
    expect(geo.violations).toContainEqual({ index: 11, rule: "we1" });
  });

  it("rules='we' flags an 8-in-a-row run above center (WE-4)", () => {
    // 8 points clearly above the center of a longer series
    const data = [8, 12, 8, 12, 12, 12, 12, 12, 12, 12, 12];
    const geo = controlGeometry({ ...base, data, rules: "we" })!;
    expect(geo.violations.some((v) => v.rule === "we4")).toBe(true);
  });

  it("rules='none' → no WE-2/WE-4 run flags (only WE-1 out points)", () => {
    const data = [8, 12, 8, 12, 12, 12, 12, 12, 12, 12, 12];
    const geo = controlGeometry({ ...base, data, rules: "none" })!;
    expect(geo.violations.every((v) => v.rule === "we1")).toBe(true);
  });

  it("percentile limits use empirical p0.135/p99.865", () => {
    const geo = controlGeometry({ ...base, data: SAMPLE, limits: "percentile" })!;
    expect(geo.band.lo).toBeLessThanOrEqual(geo.band.hi);
  });

  it("baseline overrides the computed center", () => {
    const geo = controlGeometry({ ...base, data: SAMPLE, baseline: 12 })!;
    expect(geo.center.value).toBe(12);
  });

  it("n < 10 → reliable false (limits provisional)", () => {
    const geo = controlGeometry({ ...base, data: [10, 11, 9, 10, 12, 8] })!;
    expect(geo.reliable).toBe(false);
    expect(controlGeometry({ ...base, data: SAMPLE })!.reliable).toBe(true);
  });

  it("zero moving range → degenerate (band collapses, no violations)", () => {
    const geo = controlGeometry({ ...base, data: [7, 7, 7, 7, 7] })!;
    expect(geo.degenerate).toBe(true);
    expect(geo.band.lo).toBe(geo.band.hi);
    expect(geo.violations).toHaveLength(0);
  });

  it("empty → null", () => {
    expect(controlGeometry({ ...base, data: [] })).toBeNull();
  });

  test.prop([
    fc.array(fc.double({ noNaN: true, min: -1e3, max: 1e3 }), { minLength: 1, maxLength: 60 }),
  ])("containment: points inside the plot; band within it", (data) => {
    const geo = controlGeometry({ ...base, data });
    if (!geo) return;
    for (const p of geo.points) {
      expect(p.y).toBeGreaterThanOrEqual(1.99);
      expect(p.y).toBeLessThanOrEqual(14.01);
    }
    expect(geo.band.y).toBeGreaterThanOrEqual(1.99);
    expect(geo.band.y + geo.band.height).toBeLessThanOrEqual(14.01);
  });
});
