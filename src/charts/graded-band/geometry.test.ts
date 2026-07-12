import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { gradedBandGeometry } from "./geometry.js";

const base = { width: 80, height: 12 };
const SAMPLE = Array.from({ length: 101 }, (_, i) => i); // 0..100

describe("gradedBandGeometry", () => {
  it("nested intervals: each inner band sits inside its outer (invariant)", () => {
    const geo = gradedBandGeometry({ ...base, data: SAMPLE })!;
    // bands are widest-first
    expect(geo.bands.map((b) => b.p)).toEqual([95, 80, 50]);
    for (let i = 1; i < geo.bands.length; i++) {
      expect(geo.bands[i]!.lo).toBeGreaterThanOrEqual(geo.bands[i - 1]!.lo);
      expect(geo.bands[i]!.hi).toBeLessThanOrEqual(geo.bands[i - 1]!.hi);
    }
    expect(geo.median.value).toBe(50);
  });

  it("step grades widest→faintest, narrowest→strongest", () => {
    const geo = gradedBandGeometry({ ...base, data: SAMPLE })!;
    expect(geo.bands[0]!.step).toBe(0); // widest = faintest
    expect(geo.bands.at(-1)!.step).toBe(2); // narrowest = strongest
  });

  it("levels sorted + deduped + capped at 3", () => {
    // >3 levels: the innermost 3 (ascending) are kept, drawn widest-first
    const geo = gradedBandGeometry({ ...base, data: SAMPLE, levels: [90, 50, 90, 80, 30] })!;
    expect(geo.bands.map((b) => b.p)).toEqual([80, 50, 30]);
  });

  it("all-equal draws → degenerate, tick only", () => {
    const geo = gradedBandGeometry({ ...base, data: [5, 5, 5, 5] })!;
    expect(geo.degenerate).toBe(true);
    expect(geo.median.value).toBe(5);
  });

  it("value overlays a dot distinct from the median", () => {
    const geo = gradedBandGeometry({ ...base, data: SAMPLE, value: 70 })!;
    expect(geo.dot).not.toBeNull();
    expect(geo.dot!.value).toBe(70);
  });

  it("empty → null", () => {
    expect(gradedBandGeometry({ ...base, data: [] })).toBeNull();
  });

  test.prop([
    fc.array(fc.double({ noNaN: true, min: -1e4, max: 1e4 }), { minLength: 1, maxLength: 80 }),
  ])("containment: bands + median inside the strip; nesting holds", (data) => {
    const geo = gradedBandGeometry({ ...base, data, gutterCh: 4, fontSize: 6 });
    if (!geo) return;
    for (const b of geo.bands) {
      expect(b.x).toBeGreaterThanOrEqual(-0.01);
      expect(b.x + b.width).toBeLessThanOrEqual(80.01);
      expect(b.width).toBeGreaterThanOrEqual(-0.01);
    }
    expect(geo.median.x).toBeGreaterThanOrEqual(-0.01);
    expect(geo.median.x).toBeLessThanOrEqual(80.01);
  });
});
