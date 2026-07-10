import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { windBarbGeometry } from "./geometry.js";

describe("windBarbGeometry (plan/25 §8, plan/17 F3)", () => {
  it("quantizes magnitude into pennant / full / half barbs", () => {
    const geo = windBarbGeometry({ direction: 0, magnitude: 65, step: 10, width: 24, height: 24 });
    expect(geo.counts).toEqual({ pennant: 1, full: 1, half: 1 }); // 50 + 10 + 5
  });

  it("rounds to the nearest half-step", () => {
    const geo = windBarbGeometry({ direction: 0, magnitude: 32, step: 10, width: 24, height: 24 });
    expect(geo.counts).toEqual({ pennant: 0, full: 3, half: 0 }); // 32 → 30
  });

  it("saturates a non-physical magnitude — bounded, contained glyph", () => {
    // 1e15 once looped ~2e13 times (unbounded alloc + viewBox escape); the drawn
    // glyph must clamp to what fits the shaft. Summary still reports the real value.
    const geo = windBarbGeometry({
      direction: 45,
      magnitude: 1e15,
      step: 10,
      width: 24,
      height: 24,
    });
    expect(geo.calm).toBe(false);
    expect(geo.barbs.length + geo.pennants.length).toBeLessThan(20);
    const coords = [
      ...geo.barbs.flatMap((b) => [b.x1, b.y1, b.x2, b.y2]),
      ...geo.pennants.flatMap((p) => p.match(/-?\d+(?:\.\d+)?/g)!.map(Number)),
    ];
    for (const c of coords) {
      expect(c).toBeGreaterThanOrEqual(-2);
      expect(c).toBeLessThanOrEqual(26);
    }
  });

  it("near-zero magnitude → calm (no shaft, no barbs)", () => {
    const geo = windBarbGeometry({ direction: 90, magnitude: 1, step: 10, width: 24, height: 24 });
    expect(geo.calm).toBe(true);
    expect(geo.barbs.length).toBe(0);
  });

  it("0° points up (north); 90° points right (east)", () => {
    const north = windBarbGeometry({
      direction: 0,
      magnitude: 20,
      step: 10,
      width: 24,
      height: 24,
    });
    expect(north.shaft.y2).toBeLessThan(north.shaft.y1); // tip above center
    const east = windBarbGeometry({
      direction: 90,
      magnitude: 20,
      step: 10,
      width: 24,
      height: 24,
    });
    expect(east.shaft.x2).toBeGreaterThan(east.shaft.x1); // tip right of center
  });

  test.prop([fc.integer({ min: 0, max: 359 }), fc.double({ min: 0, max: 200, noNaN: true })])(
    "shaft + barbs stay inside the glyph box",
    (direction, magnitude) => {
      const geo = windBarbGeometry({ direction, magnitude, step: 10, width: 24, height: 24 });
      const coords = [
        geo.shaft.x1,
        geo.shaft.y1,
        geo.shaft.x2,
        geo.shaft.y2,
        ...geo.barbs.flatMap((b) => [b.x1, b.y1, b.x2, b.y2]),
      ];
      for (const c of coords) {
        expect(c).toBeGreaterThanOrEqual(-2);
        expect(c).toBeLessThanOrEqual(26);
      }
    },
  );
});
