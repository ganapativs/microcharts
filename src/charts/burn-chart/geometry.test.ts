import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { burnGeometry } from "./geometry.js";

const base = { width: 80, height: 20 };
// 11-day plan burning 4/day to 0; actual 6 days in at half the pace (behind)
const PLAN = [40, 36, 32, 28, 24, 20, 16, 12, 8, 4, 0];
const ACTUAL = [40, 38, 36, 34, 32, 30];

describe("burnGeometry", () => {
  it("draws a plan line, an actual line to today, and a projection", () => {
    const geo = burnGeometry({ ...base, plan: PLAN, actual: ACTUAL })!;
    expect(geo.plan.d).toMatch(/^M/);
    expect(geo.actual.d).toMatch(/^M/);
    expect(geo.projection).not.toBeNull();
    expect(geo.today.x).toBeGreaterThan(0);
    expect(geo.nowActual).toBe(30);
    expect(geo.nowPlan).toBe(20); // plan[5]
  });

  it("projects a behind-schedule finish (positive schedule delta)", () => {
    const geo = burnGeometry({ ...base, plan: PLAN, actual: ACTUAL })!;
    // slope over last 2 = -2/day; 30 remain → 15 more days from day 5 = finish day 20
    // deadline is day 10 → 10 days late
    expect(geo.finishes).toBe(true);
    expect(geo.landing!.delta).toBe(10);
  });

  it("projects an ahead-of-schedule finish (negative delta)", () => {
    const fast = [40, 34, 28, 22, 16, 10]; // burning 6/day
    const geo = burnGeometry({ ...base, plan: PLAN, actual: fast })!;
    // slope -6; 10 remain → ~1.67 more days from day 5 ≈ finish day 6.67 → deadline 10 → early
    expect(geo.finishes).toBe(true);
    expect(geo.landing!.delta).toBeLessThan(0);
  });

  it("flatlined burn (non-decreasing) → no landing, does not finish", () => {
    const stalled = [40, 38, 37, 36, 36, 36]; // last-k slope is flat/rising
    const geo = burnGeometry({ ...base, plan: PLAN, actual: stalled })!;
    expect(geo.finishes).toBe(false);
    expect(geo.landing).toBeNull();
  });

  it("projection={false} drops the projection + landing", () => {
    const geo = burnGeometry({ ...base, plan: PLAN, actual: ACTUAL, projection: false })!;
    expect(geo.projection).toBeNull();
    expect(geo.landing).toBeNull();
  });

  it("mode='up' burns toward the plan's final scope", () => {
    const planUp = [0, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40]; // scope 40
    const actualUp = [0, 3, 6, 9, 12, 15]; // 3/day
    const geo = burnGeometry({ ...base, plan: planUp, actual: actualUp, mode: "up" })!;
    expect(geo.finishes).toBe(true); // rising toward 40
    expect(geo.landing!.delta).toBeGreaterThan(0); // 3/day is slower than plan's 4/day → late
  });

  it("empty plan → actual-only, no projection landing target issues", () => {
    const geo = burnGeometry({ ...base, plan: [], actual: ACTUAL })!;
    expect(geo.plan.d).toBe("");
    expect(geo.nowPlan).toBeNull();
  });

  it("both empty → null", () => {
    expect(burnGeometry({ ...base, plan: [], actual: [] })).toBeNull();
  });

  it("elapsed/total count the PLOTTED values, not the raw arrays", () => {
    // Non-finite entries are filtered before scaling, so the line stops at
    // day 2 here. Counting the props instead said "4 of 12 days in".
    const geo = burnGeometry({
      ...base,
      plan: [40, NaN, 32, Infinity, 0],
      actual: [40, NaN, 36, 34],
    })!;
    expect(geo.elapsed).toBe(3);
    expect(geo.total).toBe(3);
    expect(geo.nowActual).toBe(34);
  });

  it("a series past the spread limit scales instead of throwing", () => {
    // `Math.max(1, ...yValues)` threw RangeError here — both arrays are
    // caller-sized, so neither may be spread into a call.
    const actual = Array.from({ length: 200_000 }, (_, i) => 200_000 - i);
    const geo = burnGeometry({ ...base, plan: [], actual })!;
    expect(geo.domain[1]).toBe(200_000);
    expect(geo.elapsed).toBe(200_000);
  });

  test.prop([
    fc.array(fc.double({ noNaN: true, min: 0, max: 100 }), { minLength: 2, maxLength: 30 }),
    fc.array(fc.double({ noNaN: true, min: 0, max: 100 }), { minLength: 1, maxLength: 20 }),
  ])("containment: plan + actual points inside the plot", (plan, actual) => {
    const geo = burnGeometry({ ...base, plan, actual, gutterCh: 4, fontSize: 8 });
    if (!geo) return;
    for (const d of [geo.plan.d, geo.actual.d]) {
      const ys = [...d.matchAll(/[ML]-?[\d.]+ (-?[\d.]+)/g)].map((m) => Number(m[1]));
      for (const y of ys) {
        expect(y).toBeGreaterThanOrEqual(1.99);
        expect(y).toBeLessThanOrEqual(18.01);
      }
    }
  });
});
