import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { isCalm, resolveStep, windBarbGeometry } from "./geometry.js";

describe("windBarbGeometry", () => {
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

  it("resolves a hostile step to the documented quantum", () => {
    // NaN and 0 left a bare shaft with no feathers, and -5 quantized 32 into a
    // WMO reading of 35 — all three while the name announced "magnitude 32".
    for (const step of [Number.NaN, 0, -5, Number.POSITIVE_INFINITY, undefined]) {
      expect(resolveStep(step), `step=${step}`).toBe(10);
      const geo = windBarbGeometry({
        direction: 45,
        magnitude: 32,
        step: step!,
        width: 32,
        height: 32,
      });
      expect(geo.counts, `step=${step}`).toEqual({ pennant: 0, full: 3, half: 0 });
    }
  });

  it("resolves a hostile size to the documented 32 box", () => {
    // size={NaN} drew a NaN shaft and a NaN seat; size={-20} put the shaft at
    // x=-18, outside a box that does not clip.
    for (const size of [Number.NaN, 0, -20, Number.POSITIVE_INFINITY]) {
      const geo = windBarbGeometry({
        direction: 45,
        magnitude: 32,
        step: 10,
        width: size,
        height: size,
      });
      expect(geo.center, `size=${size}`).toEqual({ x: 16, y: 16 });
      const coords = [geo.shaft.x1, geo.shaft.y1, geo.shaft.x2, geo.shaft.y2, geo.y0, geo.y1];
      for (const c of coords) expect(Number.isFinite(c), `size=${size}`).toBe(true);
    }
  });

  it("a box too small for the shaft collapses inward, never backwards", () => {
    // R was width/2 - 2, so a 2-unit box gave the shaft a negative radius and
    // pointed it out of its own glyph.
    const geo = windBarbGeometry({ direction: 90, magnitude: 32, step: 10, width: 2, height: 2 });
    expect(geo.shaft).toEqual({ x1: 1, y1: 1, x2: 1, y2: 1 });
    expect(geo.barbs).toEqual([]);
  });

  it("non-finite direction is calm — a barb needs an angle", () => {
    for (const direction of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
      expect(isCalm(direction, 32, 10), `direction=${direction}`).toBe(true);
      const geo = windBarbGeometry({ direction, magnitude: 32, step: 10, width: 24, height: 24 });
      expect(geo.calm, `direction=${direction}`).toBe(true);
      expect(geo.shaft, `direction=${direction}`).toEqual({ x1: 12, y1: 12, x2: 12, y2: 12 });
    }
  });

  it("isCalm resolves step itself, so no caller can ask on the wrong scale", () => {
    expect(isCalm(45, 32, Number.POSITIVE_INFINITY)).toBe(false); // step/4 was Infinity
    expect(isCalm(45, 1, Number.NaN)).toBe(true); // 1 < 10/4
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

  test.prop([fc.integer({ min: 0, max: 359 }), fc.double({ min: 0, max: 1e12, noNaN: true })])(
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

  test.prop([fc.double(), fc.double(), fc.double(), fc.double()])(
    "no prop combination leaks a non-finite coordinate",
    (direction, magnitude, step, size) => {
      const geo = windBarbGeometry({ direction, magnitude, step, width: size, height: size });
      const coords = [
        geo.shaft.x1,
        geo.shaft.y1,
        geo.shaft.x2,
        geo.shaft.y2,
        geo.center.x,
        geo.center.y,
        geo.y0,
        geo.y1,
        ...geo.barbs.flatMap((b) => [b.x1, b.y1, b.x2, b.y2]),
        ...geo.pennants.flatMap((p) => p.match(/-?\d+(?:\.\d+)?/g)!.map(Number)),
      ];
      for (const c of coords) expect(Number.isFinite(c)).toBe(true);
    },
  );
});

it("a bearing past the trig functions' argument-reduction limit still draws", () => {
  // 5.7e307 is finite, so it clears `isCalm`, but `Math.sin`/`Math.cos` return
  // NaN that far out and the whole glyph came back at NaN coordinates.
  const geo = windBarbGeometry({
    direction: 5.722234971514057e307,
    magnitude: 2.5,
    step: 0,
    width: 32,
    height: 32,
  });
  for (const c of [geo.shaft.x2, geo.shaft.y2, ...geo.barbs.flatMap((b) => [b.x2, b.y2])])
    expect(Number.isFinite(c)).toBe(true);
});

it("a bearing is modular: 361° draws the same glyph as 1°", () => {
  const at = (direction: number) =>
    JSON.stringify(windBarbGeometry({ direction, magnitude: 20, step: 5, width: 32, height: 32 }));
  expect(at(361)).toBe(at(1));
  expect(at(-359)).toBe(at(1));
});

it("a huge but finite box cannot make the glyph loops unbounded", () => {
  // `chartSide` only rejects a NON-finite size, so 1e308 is a legal box — and
  // the shaft's capacity is derived from it, which left room for ~1.6e307
  // pennants. The draw loops then allocated until the worker died (this test
  // file was crashing its vitest fork, not failing an assertion).
  const geo = windBarbGeometry({
    direction: 45,
    magnitude: 1e300,
    step: 1,
    width: 1e308,
    height: 1e308,
  });
  expect(geo.pennants.length).toBeLessThanOrEqual(24);
  expect(geo.barbs.length).toBeLessThanOrEqual(25);
});
