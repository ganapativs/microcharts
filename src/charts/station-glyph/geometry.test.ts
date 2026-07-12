import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { stationGlyphGeometry } from "./geometry.js";

const at = (over: Partial<Parameters<typeof stationGlyphGeometry>[0]> = {}) =>
  stationGlyphGeometry({
    cloud: null,
    wind: null,
    step: 10,
    cx: 15,
    cy: 15,
    coreR: 7,
    barbBox: 30,
    ...over,
  });

describe("stationGlyphGeometry", () => {
  it("sky cover rounds to a 0–4 index; disc fills by fraction", () => {
    expect(at({ cloud: 0 }).oktaIndex).toBe(0);
    expect(at({ cloud: 0.75 }).oktaIndex).toBe(3);
    expect(at({ cloud: 1 }).oktaIndex).toBe(4);
    expect(at({ cloud: 0 }).cloudPath).toBe("");
    expect(at({ cloud: 1 }).cloudPath).not.toBe("");
  });

  it("wind barb appears only above the calm threshold, centered on the disc", () => {
    expect(at({ wind: { direction: 0, magnitude: 1 } }).barb).toBeNull();
    const geo = at({ wind: { direction: 225, magnitude: 15 }, cx: 15, cy: 15, coreR: 7 });
    expect(geo.barb).not.toBeNull();
    // the shaft is anchored at the disc center (the filled disc masks its inner half)
    expect(geo.barb!.shaft.x1).toBeCloseTo(15, 5);
    expect(geo.barb!.shaft.y1).toBeCloseTo(15, 5);
  });

  test.prop([
    fc.double({ min: 0, max: 1, noNaN: true }),
    fc.integer({ min: 0, max: 359 }),
    fc.double({ min: 0, max: 80, noNaN: true }),
  ])("disc and barb stay inside the size box", (cloud, direction, magnitude) => {
    const size = 30;
    const geo = stationGlyphGeometry({
      cloud,
      wind: { direction, magnitude },
      step: 10,
      cx: size / 2,
      cy: size / 2,
      coreR: size * 0.24,
      barbBox: size,
    });
    expect(geo.disc.cx + geo.disc.r).toBeLessThanOrEqual(size);
    expect(geo.disc.cx - geo.disc.r).toBeGreaterThanOrEqual(0);
    if (geo.barb) {
      for (const s of geo.barb.barbs) {
        for (const c of [s.x1, s.y1, s.x2, s.y2]) {
          expect(c).toBeGreaterThanOrEqual(-0.6);
          expect(c).toBeLessThanOrEqual(size + 0.6);
        }
      }
    }
  });
});
