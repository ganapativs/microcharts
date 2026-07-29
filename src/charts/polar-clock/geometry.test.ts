import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { polarClockGeometry, polarStart } from "./geometry.js";

const g = (
  values: readonly (number | null)[],
  extra: Partial<Parameters<typeof polarClockGeometry>[0]> = {},
) =>
  polarClockGeometry({
    values,
    size: 24,
    inner: 0.35,
    origin: 0,
    pad: 1,
    mode: "length",
    ...extra,
  });

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

  it("origin rotates which index sits at 12 o'clock", () => {
    const geo = g([1, 2, 3, 4], { origin: 2 });
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

  it("polarStart is the one rotation normalizer: floors, wraps, refuses garbage", () => {
    expect(polarStart(1.5, 7)).toBe(1); // fractional floors to a real slot
    expect(polarStart(-1, 7)).toBe(6); // negatives wrap
    expect(polarStart(9, 7)).toBe(2); // past the cycle wraps
    expect(polarStart(Number.NaN, 7)).toBe(0);
    expect(polarStart(Infinity, 7)).toBe(0);
    expect(polarStart(3, 0)).toBe(0); // no segments, no rotation
  });

  it("a fractional `origin` rotates by whole slots (the paint has no half-segment)", () => {
    // origin 1.5 must place index 1 at 12 o'clock, exactly as origin 1 does.
    const half = g([10, 20, 30, 40], { origin: 1.5 });
    const whole = g([10, 20, 30, 40], { origin: 1 });
    expect(half.segments.map((s) => s.pos)).toEqual(whole.segments.map((s) => s.pos));
    expect(half.segments[1]!.pos).toBe(0);
  });

  it("the guide centre is the painted centre (client hit-testing shares it)", () => {
    // The box is the integer the viewBox carries, so a fractional `size` centres
    // on that box — not on the raw prop, which left the dial off-centre by up to
    // half a unit from the frame the pointer is mapped over.
    const geo = g([1, 2, 3], { size: 25.5 });
    expect(geo.size).toBe(26);
    expect(geo.guide.cx).toBe(13);
    expect(geo.guide.cy).toBe(13);
  });

  it("an unusable `size` falls back to the documented default, not to NaN marks", () => {
    // Every radius went NaN, so annulusSector returned "" — a chart that painted
    // nothing inside a 1×1 viewBox while announcing a full summary.
    for (const size of [Number.NaN, Infinity, -Infinity, -40, 0]) {
      const geo = g([10, 40, 20], { size });
      expect(geo.size).toBe(24);
      expect(geo.guide.cx).toBe(12);
      expect(geo.segmentsPath).not.toBe("");
      expect(geo.segmentsPath + geo.cardinalPath).not.toMatch(/NaN|Infinity/);
    }
  });

  it("the guide radius is never negative (an invalid SVG attribute)", () => {
    for (const size of [1, 2, 3]) {
      expect(g([10, 40, 20], { size }).guide.r).toBeGreaterThanOrEqual(0);
    }
  });

  it("cardinal ticks stay inside the box at every size", () => {
    // They ran to a fixed rMax + 1.4 against a 1-unit pad, so all four ended 0.4
    // units past the viewBox — and `.mc-root` is overflow: visible.
    for (const size of [1, 2, 8, 12, 24, 40, 80, 200]) {
      const geo = g([10, 40, 20], { size });
      const nums = geo.cardinalPath.match(/-?\d+\.?\d*/g)!.map(Number);
      expect(nums.length).toBe(16); // four M…L… ticks, x/y each
      for (const v of nums) {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(geo.size);
      }
    }
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
