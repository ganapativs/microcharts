import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { spiralYearGeometry } from "./geometry.js";

const g = (
  values: readonly (number | null)[],
  extra: Partial<Parameters<typeof spiralYearGeometry>[0]> = {},
) =>
  spiralYearGeometry({
    values,
    size: 24,
    steps: 5,
    cadence: "week",
    startIndex: 0,
    pad: 1,
    ...extra,
  });

describe("spiralYearGeometry — calendar spiral", () => {
  it("one mark per finite value; peak/min tracked", () => {
    const geo = g([10, 40, 20, 5]);
    expect(geo.marks.length).toBe(4);
    expect(geo.peakIndex).toBe(1);
    expect(geo.minIndex).toBe(3);
  });

  it("groups marks into ≤ steps paths (O(steps), not O(days))", () => {
    const geo = g(Array.from({ length: 52 }, (_, i) => i));
    expect(geo.stepPaths.length).toBe(5);
    expect(geo.marks.length).toBe(52);
  });

  it("radius grows outward per turn — later marks are farther from center", () => {
    const geo = g(
      Array.from({ length: 104 }, () => 1),
      { cadence: "week" },
    );
    const first = geo.marks[0]!;
    const later = geo.marks[103]!;
    const cx = geo.size / 2;
    const cy = geo.size / 2;
    const r0 = Math.hypot(first.cx - cx, first.cy - cy);
    const r1 = Math.hypot(later.cx - cx, later.cy - cy);
    expect(r1).toBeGreaterThan(r0);
  });

  it("null → a gap (no mark), distinct from a step-1 dot", () => {
    const geo = g([10, null, 30]);
    expect(geo.marks.length).toBe(2);
    expect(geo.marks.some((m) => m.index === 1)).toBe(false);
  });

  it("step quantization spans 0.steps-1", () => {
    const geo = g([0, 25, 50, 75, 100]);
    const steps = new Set(geo.marks.map((m) => m.step));
    expect(Math.max(...steps)).toBe(4);
    expect(Math.min(...steps)).toBe(0);
  });

  it("day cadence emits 12 month ticks merged into one path", () => {
    const geo = g(
      Array.from({ length: 365 }, (_, i) => i),
      { cadence: "day" },
    );
    // 12 "M" (moveto) commands = 12 ticks, all in one path string (one node).
    expect((geo.monthTicksPath.match(/M/g) ?? []).length).toBe(12);
  });

  it("mark='arc' produces arc subpaths, not circles", () => {
    const geo = g([10, 40, 20], { mark: "arc" });
    expect(geo.mark).toBe("arc");
    expect(geo.stepPaths.join("")).toMatch(/A/); // elliptical-arc command
  });

  it("all-null → empty", () => {
    expect(g([null, null]).marks.length).toBe(0);
  });

  test.prop([fc.array(fc.integer({ min: 0, max: 100 }), { minLength: 1, maxLength: 120 })])(
    "every mark stays inside the box",
    (values) => {
      const geo = g(values, { cadence: "week" });
      for (const m of geo.marks) {
        expect(m.cx - m.r).toBeGreaterThanOrEqual(-0.6);
        expect(m.cx + m.r).toBeLessThanOrEqual(geo.size + 0.6);
        expect(m.cy - m.r).toBeGreaterThanOrEqual(-0.6);
        expect(m.cy + m.r).toBeLessThanOrEqual(geo.size + 0.6);
      }
    },
  );
});
