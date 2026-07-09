import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { dualWindowGeometry, rollingMean } from "./geometry.js";

describe("dualWindowGeometry (plan/25 §11, plan/17 F4)", () => {
  it("rolling mean has a leading gap until the window fills", () => {
    expect(rollingMean([1, 2, 3, 4], 2)).toEqual([null, 1.5, 2.5, 3.5]);
    expect(rollingMean([1, 2, 3], 3)).toEqual([null, null, 2]);
  });

  it("co-plots two windows against a target", () => {
    const data = Array.from({ length: 40 }, (_, i) => 20 + Math.sin(i / 3) * 5);
    const geo = dualWindowGeometry({
      data,
      windows: [3, 30],
      target: 20,
      band: null,
      domain: null,
      width: 100,
      height: 24,
      gutter: 12,
    });
    expect(geo.fastPath).toContain("M");
    expect(geo.slowPath).toContain("M");
    expect(geo.fastLast).not.toBeNull();
    expect(geo.slowLast).not.toBeNull();
  });

  it("band renders a corridor rect", () => {
    const data = Array.from({ length: 40 }, (_, i) => 20 + Math.sin(i / 3) * 5);
    const geo = dualWindowGeometry({
      data,
      windows: [3, 30],
      target: 20,
      band: [18, 22],
      domain: null,
      width: 100,
      height: 24,
      gutter: 12,
    });
    expect(geo.bandRect).not.toBeNull();
    expect(geo.bandRect!.height).toBeGreaterThan(0);
  });

  test.prop([
    fc.array(fc.double({ min: -50, max: 50, noNaN: true }), { minLength: 1, maxLength: 100 }),
  ])("paths stay inside the plot", (data) => {
    const geo = dualWindowGeometry({
      data,
      windows: [3, 30],
      target: 0,
      band: null,
      domain: [-50, 50],
      width: 100,
      height: 24,
      gutter: 12,
    });
    for (const m of `${geo.fastPath}${geo.slowPath}`.matchAll(/[ML]([\d.]+) ([\d.]+)/g)) {
      expect(Number(m[1])).toBeLessThanOrEqual(88.01);
      expect(Number(m[2])).toBeGreaterThanOrEqual(-0.01);
      expect(Number(m[2])).toBeLessThanOrEqual(24.01);
    }
  });
});
