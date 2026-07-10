import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { etaBarGeometry } from "./geometry.js";

describe("etaBarGeometry (plan/25 §3, plan/17 F14)", () => {
  it("remainder is sized by observed rate, not linear interpolation", () => {
    const geo = etaBarGeometry({ progress: 0.64, elapsed: 3.6, rate: 0.18, width: 80, height: 8 });
    expect(geo.remainingTime).toBeCloseTo(2, 1);
    expect(geo.remaining).not.toBeNull();
    expect(geo.indeterminate).toBe(false);
  });

  it("a slower rate grows the remainder (the feature)", () => {
    const fast = etaBarGeometry({ progress: 0.5, elapsed: 10, rate: 0.1, width: 80, height: 8 });
    const slow = etaBarGeometry({ progress: 0.5, elapsed: 10, rate: 0.02, width: 80, height: 8 });
    expect(slow.remainingTime!).toBeGreaterThan(fast.remainingTime!);
    expect(slow.done.width).toBeLessThan(fast.done.width);
  });

  it("rate ≤ 0 / absent → indeterminate (stalled), never a fake countdown", () => {
    const stalled = etaBarGeometry({ progress: 0.3, elapsed: 10, rate: 0, width: 80, height: 8 });
    expect(stalled.indeterminate).toBe(true);
    expect(stalled.remainingTime).toBeNull();
  });

  it("progress ≥ 1 → full bar, no remainder", () => {
    const done = etaBarGeometry({ progress: 1, elapsed: 10, rate: 0.1, width: 80, height: 8 });
    expect(done.remaining).toBeNull();
    expect(done.remainingTime).toBe(0);
  });

  it("remainder ≫ elapsed → done clamps to 10% + overflow chevron", () => {
    const geo = etaBarGeometry({ progress: 0.01, elapsed: 1, rate: 0.0001, width: 80, height: 8 });
    expect(geo.overflow).toBe(true);
    expect(geo.done.width).toBeCloseTo(0.1 * 78, 0);
  });

  test.prop([
    fc.double({ min: 0, max: 1, noNaN: true }),
    fc.double({ min: 0.1, max: 1000, noNaN: true }),
    fc.double({ min: 0.001, max: 10, noNaN: true }),
  ])("containment: done + remaining stay inside the track", (progress, elapsed, rate) => {
    const geo = etaBarGeometry({ progress, elapsed, rate, width: 80, height: 8 });
    expect(geo.done.x + geo.done.width).toBeLessThanOrEqual(80.01);
    if (geo.remaining) {
      expect(geo.remaining.x + geo.remaining.width).toBeLessThanOrEqual(80.01);
      expect(geo.remaining.x).toBeGreaterThanOrEqual(geo.done.x + geo.done.width - 0.01);
    }
  });
});
