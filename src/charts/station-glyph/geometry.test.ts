import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import {
  hasWind,
  resolveSize,
  resolveStep,
  stationGlyphGeometry,
  stationLayout,
} from "./geometry.js";

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

  it("resolves a hostile step to the documented quantum, in the geometry too", () => {
    for (const step of [Number.NaN, 0, -10, Number.POSITIVE_INFINITY, undefined])
      expect(resolveStep(step)).toBe(10);
    expect(resolveStep(5)).toBe(5);
    // step 0 used to leave the shaft with no feathers; NaN dropped the barb
    // while the summary still announced the wind.
    const wind = { direction: 225, magnitude: 15 };
    for (const step of [Number.NaN, 0, -10])
      expect(at({ wind, step }).barb?.counts).toEqual(at({ wind }).barb?.counts);
  });

  it("a non-finite direction is an absent wind, not a NaN shaft", () => {
    expect(hasWind({ direction: Number.NaN, magnitude: 15 })).toBe(false);
    expect(hasWind({ direction: 225, magnitude: Number.NaN })).toBe(false);
    expect(hasWind(null)).toBe(false);
    expect(hasWind({ direction: 225, magnitude: 15 })).toBe(true);
    for (const direction of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])
      expect(at({ wind: { direction, magnitude: 15 } }).barb).toBeNull();
  });
});

const lay = (over: Partial<Parameters<typeof stationLayout>[0]> = {}) =>
  stationLayout({ size: 48, temp: "16°", dew: "9°", pressure: "1,013", ...over });

describe("stationLayout", () => {
  it("a hostile size falls back to 48 — never NaN in the viewBox or the seat", () => {
    for (const size of [Number.NaN, 0, -40, Number.POSITIVE_INFINITY, undefined])
      expect(resolveSize(size)).toBe(48);
    expect(resolveSize(34)).toBe(34);
    for (const size of [Number.NaN, 0, -40, Number.POSITIVE_INFINITY, undefined])
      expect(lay({ size })).toEqual(lay());
    expect(lay().box).toBe(48);
  });

  it("the station id widens the box rightward, leaving the disc where it was", () => {
    const plain = lay();
    const long = lay({ station: "WWWWWWWWWWWWWWWWWWWW" });
    expect(long.width).toBeGreaterThan(plain.width);
    expect(long.cx).toBe(plain.cx);
    expect(long.cy).toBe(plain.cy);
    // an ordinary ICAO id already fits the numeral gutters
    expect(lay({ station: "KSFO" }).width).toBe(plain.width);
  });
});

describe("stationGlyphGeometry (containment)", () => {
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
