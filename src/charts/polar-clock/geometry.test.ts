import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { polarClockGeometry } from "./geometry.js";

const g = (
  values: readonly (number | null)[],
  extra: Partial<Parameters<typeof polarClockGeometry>[0]> = {},
) =>
  polarClockGeometry({ values, size: 24, inner: 0.35, start: 0, pad: 1, mode: "length", ...extra });

describe("polarClockGeometry — cyclic radial bars", () => {
  it("one segment per value; peak has the longest bar", () => {
    const geo = g([10, 40, 20, 5]);
    expect(geo.segments.length).toBe(4);
    expect(geo.peakIndex).toBe(1);
    expect(geo.minIndex).toBe(3);
    const rPeak = geo.segments[1]!.rOuter;
    expect(geo.segments.every((s) => s.rOuter <= rPeak)).toBe(true);
  });

  it("zero-anchored: a zero value collapses to the baseline (no bar)", () => {
    const geo = g([0, 40]);
    expect(geo.segments[0]!.rOuter).toBeCloseTo(geo.guide.r, 1);
  });

  it("null segment is skipped (missing ≠ zero)", () => {
    const geo = g([10, null, 30]);
    expect(geo.segments[1]!.isNull).toBe(true);
    // the merged path has sectors only for the two finite segments
    expect((geo.segmentsPath.match(/M/g) ?? []).length).toBeGreaterThanOrEqual(2);
  });

  it("start rotates which index sits at 12 o'clock", () => {
    const geo = g([1, 2, 3, 4], { start: 2 });
    expect(geo.segments[2]!.pos).toBe(0); // index 2 → 12 o'clock slot
  });

  it("opacity mode → grouped level paths, no length path", () => {
    const geo = g([1, 2, 3, 4, 5], { mode: "opacity" });
    expect(geo.segmentsPath).toBe("");
    expect(geo.levelPaths.length).toBeGreaterThan(0);
    expect(geo.levelPaths.every((lp) => lp.opacity > 0 && lp.opacity <= 1)).toBe(true);
  });

  it("now → an accent path for that segment", () => {
    expect(g([10, 40, 20], { now: 1 }).accentPath).not.toBeNull();
  });

  it("all-equal → flat", () => {
    expect(g([5, 5, 5, 5]).flat).toBe(true);
    expect(g([1, 2, 3]).flat).toBe(false);
  });

  it("all-null → empty", () => {
    const geo = g([null, null]);
    expect(geo.segments.length).toBe(0);
    expect(geo.segmentsPath).toBe("");
  });

  test.prop([fc.array(fc.integer({ min: 0, max: 100 }), { minLength: 1, maxLength: 24 })])(
    "every generated coordinate stays inside the box",
    (values) => {
      const geo = g(values);
      const nums =
        (geo.segmentsPath + (geo.accentPath ?? "")).match(/-?\d+\.?\d*/g)?.map(Number) ?? [];
      // path coords interleave x y (arc flags are small ints ≤ 1, always in range)
      for (const v of nums) {
        expect(v).toBeGreaterThanOrEqual(-0.6);
        expect(v).toBeLessThanOrEqual(geo.size + 0.6);
      }
    },
  );
});
