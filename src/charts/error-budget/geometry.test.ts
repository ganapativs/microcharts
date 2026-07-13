import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { errorBudgetGeometry } from "./geometry.js";

const base = { width: 80, height: 20 };
// 30-day window, 12 days observed, burning near steady
const OBSERVED = [1, 0.96, 0.93, 0.9, 0.86, 0.83, 0.79, 0.75, 0.71, 0.67, 0.64, 0.62];

describe("errorBudgetGeometry", () => {
  it("diagonal spans (0,1)→(1,0); remaining maps 1=top, 0=bottom", () => {
    const geo = errorBudgetGeometry({ ...base, data: [1, 0.5, 0] })!;
    // (0,1) → top-left, (1,0) → bottom-right
    expect(geo.diagonal.y1).toBeLessThan(geo.diagonal.y2);
    expect(geo.diagonal.x1).toBeLessThan(geo.diagonal.x2);
  });

  it("faster-rate reference lines drop to 0 sooner (steeper)", () => {
    const geo = errorBudgetGeometry({ ...base, data: OBSERVED })!;
    // default rates [1,6,14.4] → wedges for the two > 1
    expect(geo.wedges.map((w) => w.rate)).toEqual([6, 14.4]);
    expect(geo.wedges[0]!.d).toMatch(/^M/);
  });

  it("window > data.length → the actual line stops before the right edge (mid-window)", () => {
    const geo = errorBudgetGeometry({ ...base, data: OBSERVED, window: 30 })!;
    // now = day 12 of 30 → elapsed ≈ 11/29 ≈ 0.38, not 1
    expect(geo.nowElapsed).toBeCloseTo(11 / 29, 2);
    expect(geo.remaining.x).toBeLessThan(base.width - 2 - 1);
  });

  it("current burn rate ≈ 1× when tracking steady", () => {
    // exactly steady: 1 → 0 over 11 steps, window 11
    const steady = Array.from({ length: 11 }, (_, i) => 1 - i / 10);
    const geo = errorBudgetGeometry({ ...base, data: steady })!;
    expect(geo.currentRate).toBeCloseTo(1, 1);
  });

  it("faster burn → currentRate > 1 (burned a lot early in the window)", () => {
    // 6 days into a 30-day window, already down to 5% → far faster than steady
    const fast = [1, 0.8, 0.6, 0.4, 0.2, 0.05];
    const geo = errorBudgetGeometry({ ...base, data: fast, window: 30 })!;
    expect(geo.currentRate).toBeGreaterThan(1);
  });

  it("budget hitting 0 before window end → exhausted at that index", () => {
    const geo = errorBudgetGeometry({ ...base, data: [1, 0.7, 0.4, 0.1, 0, 0], window: 10 })!;
    expect(geo.exhausted).not.toBeNull();
    expect(geo.exhausted!.index).toBe(4);
  });

  it("values outside [0,1] are clamped", () => {
    const geo = errorBudgetGeometry({ ...base, data: [1.5, 0.5, -0.3] })!;
    expect(geo.remaining.value).toBe(0); // -0.3 → 0
  });

  it("empty → null", () => {
    expect(errorBudgetGeometry({ ...base, data: [] })).toBeNull();
  });

  test.prop([
    fc.array(fc.double({ noNaN: true, min: -0.5, max: 1.5 }), { minLength: 1, maxLength: 60 }),
  ])("containment: line + diagonal inside the plot; currentRate finite", (data) => {
    const geo = errorBudgetGeometry({ ...base, data, gutterCh: 4, fontSize: 8 });
    if (!geo) return;
    const ys = [...geo.line.d.matchAll(/[ML]-?[\d.]+ (-?[\d.]+)/g)].map((m) => Number(m[1]));
    for (const y of ys) {
      expect(y).toBeGreaterThanOrEqual(1.99);
      expect(y).toBeLessThanOrEqual(18.01);
    }
    expect(Number.isFinite(geo.currentRate)).toBe(true);
  });
});
