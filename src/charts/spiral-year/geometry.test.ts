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

  // `.mc-root` is overflow: visible, so a mark past the viewBox is a spill, not
  // a clip — asserted at every size because the mark radius tracks `size` while
  // the pad does not, and the two only collided above ~36.
  test.prop([
    fc.array(fc.integer({ min: 0, max: 100 }), { minLength: 1, maxLength: 120 }),
    fc.integer({ min: 1, max: 200 }),
  ])("every mark stays inside the box, at any size", (values, size) => {
    const geo = g(values, { cadence: "week", size });
    for (const m of geo.marks) {
      expect(m.cx - m.r).toBeGreaterThanOrEqual(0);
      expect(m.cx + m.r).toBeLessThanOrEqual(geo.size);
      expect(m.cy - m.r).toBeGreaterThanOrEqual(0);
      expect(m.cy + m.r).toBeLessThanOrEqual(geo.size);
    }
  });
});

// Config a host computes rather than types by hand. Each case below either
// painted NaN coordinates under a confident summary, spilled outside the box,
// or threw and took the render down.
describe("spiralYearGeometry — hostile config", () => {
  const YEAR = Array.from({ length: 52 }, (_, i) => i);

  it.each([NaN, Infinity, -Infinity, 0, -40])("size=%p falls back to the 24 default", (size) => {
    const geo = g(YEAR, { size });
    expect(geo.size).toBe(24);
    for (const m of geo.marks) {
      expect(Number.isFinite(m.cx) && Number.isFinite(m.cy) && Number.isFinite(m.r)).toBe(true);
    }
    expect(geo.stepPaths.join("") + geo.monthTicksPath).not.toMatch(/NaN|Infinity/);
  });

  it.each([1, 2, 3, 5, 12, 64])("size=%p keeps every mark and tick inside the box", (size) => {
    const geo = g(YEAR, { size });
    for (const m of geo.marks) {
      expect(m.cx - m.r).toBeGreaterThanOrEqual(0);
      expect(m.cx + m.r).toBeLessThanOrEqual(geo.size);
      expect(m.cy - m.r).toBeGreaterThanOrEqual(0);
      expect(m.cy + m.r).toBeLessThanOrEqual(geo.size);
    }
    for (const c of geo.monthTicksPath.match(/-?\d+(\.\d+)?/g) ?? []) {
      expect(Number(c)).toBeGreaterThanOrEqual(0);
      expect(Number(c)).toBeLessThanOrEqual(geo.size);
    }
  });

  // `Array.from({ length })` throws RangeError on Infinity and allocates a
  // million buckets on 1e6; NaN / 0 / -1 made zero, so nothing painted.
  it.each([NaN, 0, -1, 2.5, 1e6, Infinity])("steps=%p resolves to the 5 default", (steps) => {
    const geo = g(YEAR, { steps: steps as 5 });
    expect(geo.stepPaths.length).toBe(5);
    expect(geo.marks.every((m) => m.step >= 0 && m.step <= 4)).toBe(true);
    // Every mark reaches a bucket — a lost mark is a value the chart drops.
    expect(geo.stepPaths.join("")).not.toMatch(/undefined/);
  });

  it("steps=3 is still honored", () => {
    expect(g(YEAR, { steps: 3 }).stepPaths.length).toBe(3);
  });

  it("an unknown mark kind reads back as the dot default", () => {
    const geo = g(YEAR, { mark: "blob" as unknown as "dot" });
    expect(geo.mark).toBe("dot");
  });
});
