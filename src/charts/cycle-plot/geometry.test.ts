import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { cycleGeometry, CYCLE_MAX_PERIOD } from "./geometry.js";

const base = { width: 84, height: 20 };
// 6 weeks × 7 weekdays; Fri (idx 5) peaks, Sun (idx 0) dips, Mon (idx 1) rises
const WEEKS: number[] = [];
for (let w = 0; w < 6; w++) {
  WEEKS.push(
    38 + w * 0, // Sun ~38
    40 + w * 2, // Mon rising
    45,
    48,
    52,
    61, // Fri peak
    44,
  );
}

describe("cycleGeometry", () => {
  it("reshapes into `period` slots; means position the spine", () => {
    const geo = cycleGeometry({ ...base, data: WEEKS, period: 7 })!;
    expect(geo.slots.length).toBe(7);
    expect(geo.peakSlot).toBe(5); // Fri
    expect(geo.dipSlot).toBe(0); // Sun
    expect(geo.centers[5]!).toBeCloseTo(61, 5);
  });

  it("each slot's line stays inside its own column (never crosses a boundary)", () => {
    const geo = cycleGeometry({ ...base, data: WEEKS, period: 7 })!;
    for (const sl of geo.slots) {
      if (!sl.line) continue;
      // each command is "x y"; take the x of every pair
      const xs = [...sl.line.d.matchAll(/(\d+\.?\d*) \d+\.?\d*/g)].map((m) => Number(m[1]));
      for (const x of xs) {
        expect(x).toBeGreaterThanOrEqual(sl.x0 - 0.01);
        expect(x).toBeLessThanOrEqual(sl.x1 + 0.01);
      }
    }
  });

  it("drift is last − first raw within the slot", () => {
    const geo = cycleGeometry({ ...base, data: WEEKS, period: 7 })!;
    // Mon: 40..50 over 6 weeks → +10
    expect(geo.slots[1]!.drift).toBe(10);
    expect(geo.slots[0]!.drift).toBe(0); // Sun flat
  });

  it("median center differs from mean on a skewed slot", () => {
    // period 3 → slot0 = idx 0,3,6 = {1, 100, 2}
    const data = [1, 9, 9, 100, 9, 9, 2, 9, 9];
    const mean = cycleGeometry({ ...base, data, period: 3, center: "mean" })!;
    const median = cycleGeometry({ ...base, data, period: 3, center: "median" })!;
    expect(mean.centers[0]!).toBeCloseTo((1 + 100 + 2) / 3, 5); // 34.33
    expect(median.centers[0]!).toBe(2); // sorted 1,2,100 → 2
  });

  it("period ≥ length → every slot ≤ 1 point: no lines, spine only", () => {
    const geo = cycleGeometry({ ...base, data: [5, 6, 7], period: 7 })!;
    expect(geo.slots.every((s) => s.line === null)).toBe(true);
    expect(geo.cycles).toBe(1);
  });

  it("ragged final cycle → per-slot counts differ", () => {
    // 9 points, period 4 → slots get [3, 2, 2, 2]
    const geo = cycleGeometry({ ...base, data: [1, 2, 3, 4, 5, 6, 7, 8, 9], period: 4 })!;
    expect(geo.slotCounts).toEqual([3, 2, 2, 2]);
  });

  it("nulls are excluded from a slot, never interpolated", () => {
    const geo = cycleGeometry({ ...base, data: [10, null, 30, 12, 99, 34], period: 3 })!;
    // slot1 = {null→excluded, 99} → n 1
    expect(geo.slots[1]!.n).toBe(1);
    expect(geo.slots[0]!.n).toBe(2); // {10, 12}
  });

  it("all-null / empty → null", () => {
    expect(cycleGeometry({ ...base, data: [null, null], period: 4 })).toBeNull();
    expect(cycleGeometry({ ...base, data: [], period: 4 })).toBeNull();
  });

  it("degenerate domain (all equal) flagged", () => {
    const geo = cycleGeometry({ ...base, data: [5, 5, 5, 5, 5, 5], period: 3 })!;
    expect(geo.degenerate).toBe(true);
  });

  it("saturates a non-physical period — bounded slots, contained coords", () => {
    // 1e15 once allocated 1e15 slot arrays (OOM) and drove colW → 0; the slot
    // count must clamp to CYCLE_MAX_PERIOD. Summary still reports the request.
    const geo = cycleGeometry({ ...base, data: [1, 2, 3, 4, 5], period: 1e15 })!;
    expect(geo.slots.length).toBe(CYCLE_MAX_PERIOD);
    for (const sl of geo.slots) {
      expect(sl.center.x).toBeGreaterThanOrEqual(0);
      expect(sl.center.x).toBeLessThanOrEqual(base.width);
      expect(sl.x0).toBeLessThanOrEqual(base.width);
      expect(sl.x1).toBeLessThanOrEqual(base.width + 0.01);
    }
  });

  // the 1e15 clamp is covered explicitly above; cap runs so the ≤366-slot combs
  // stay fast on CI
  test.prop(
    [
      fc.array(fc.integer({ min: 0, max: 100 }), { minLength: 1, maxLength: 60 }),
      fc.integer({ min: 4, max: 400 }),
    ],
    { numRuns: 40 },
  )("centers within domain, coords within viewBox", (data, period) => {
    const geo = cycleGeometry({ ...base, data, period });
    if (geo === null) return;
    for (const sl of geo.slots) {
      expect(sl.center.x).toBeGreaterThanOrEqual(0);
      expect(sl.center.x).toBeLessThanOrEqual(base.width);
      if (sl.n > 0) {
        expect(sl.center.y).toBeGreaterThanOrEqual(0);
        expect(sl.center.y).toBeLessThanOrEqual(base.height);
      }
    }
  });
});
