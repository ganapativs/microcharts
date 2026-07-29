import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { eventRasterGeometry, rasterDomain, resolveRasterDomain, LANE_CAP } from "./geometry.js";

const RASTER = [
  { label: "api", events: [2, 5, 9, 14, 20, 26, 33, 40, 48] },
  { label: "db", events: [3, 6, 10, 15, 21, 27, 34] },
  { label: "cache", events: [5, 20, 40] },
];

describe("eventRasterGeometry", () => {
  it("one tick per event, one path per lane", () => {
    const geo = eventRasterGeometry({
      data: RASTER,
      domain: [2, 48],
      width: 120,
      height: 24,
      gutter: 20,
      overflow: "bin",
    });
    expect(geo.lanes.length).toBe(3);
    // api lane has 9 M-commands (9 ticks)
    expect((geo.lanes[0]!.path.match(/M/g) || []).length).toBe(9);
    expect(geo.lanes[0]!.binned).toBe(false);
  });

  it("overflow='bin' switches an aliasing lane to per-bucket counts", () => {
    const dense = [{ label: "spam", events: Array.from({ length: 400 }, (_, i) => i) }];
    const geo = eventRasterGeometry({
      data: dense,
      domain: [0, 399],
      width: 120,
      height: 8,
      gutter: 0,
      overflow: "bin",
    });
    expect(geo.lanes[0]!.binned).toBe(true);
    expect(geo.lanes[0]!.bins.length).toBeGreaterThan(0);
  });

  it("overflow='clip' keeps ticks even when dense", () => {
    const dense = [{ label: "spam", events: Array.from({ length: 400 }, (_, i) => i) }];
    const geo = eventRasterGeometry({
      data: dense,
      domain: [0, 399],
      width: 120,
      height: 8,
      gutter: 0,
      overflow: "clip",
    });
    expect(geo.lanes[0]!.binned).toBe(false);
  });

  it("a hostile domain falls back to the data extent", () => {
    // hosts compute these: an empty fetch gives [NaN, NaN], a partial one
    // [0, NaN]. Both used to reach the tick path — as MNaN, and as a span of 1
    // that marched the ticks past the viewBox.
    expect(resolveRasterDomain([NaN, NaN], RASTER)).toEqual([2, 48]);
    expect(resolveRasterDomain([0, NaN], RASTER)).toEqual([2, 48]);
    expect(resolveRasterDomain([-Infinity, Infinity], RASTER)).toEqual([2, 48]);
    expect(resolveRasterDomain(undefined, RASTER)).toEqual([2, 48]);
  });

  it("a reversed domain is a window, not a mirrored axis", () => {
    // uniformBins already swaps it, so honoring the reversal made a binned lane
    // run left→right while its tick neighbours ran right→left
    expect(resolveRasterDomain([48, 2], RASTER)).toEqual([2, 48]);
    expect(resolveRasterDomain([10, 20], RASTER)).toEqual([10, 20]);
  });

  it("emits no non-finite coordinate for a domain that overflows", () => {
    const geo = eventRasterGeometry({
      data: RASTER,
      domain: [-1e308, 1e308],
      width: 120,
      height: 24,
      gutter: 0,
      overflow: "clip",
    });
    for (const lane of geo.lanes) expect(lane.path).not.toMatch(/NaN|Infinity/);
  });

  it("lanes are capped, domain spans all events", () => {
    const many = Array.from({ length: 20 }, (_, i) => ({ label: `l${i}`, events: [i, i + 5] }));
    const geo = eventRasterGeometry({
      data: many,
      domain: rasterDomain(many),
      width: 120,
      height: 96,
      gutter: 10,
      overflow: "bin",
    });
    expect(geo.lanes.length).toBe(LANE_CAP);
    expect(rasterDomain(RASTER)).toEqual([2, 48]);
  });

  test.prop([
    fc.array(fc.array(fc.integer({ min: 0, max: 100 }), { maxLength: 20 }), {
      minLength: 1,
      maxLength: 6,
    }),
  ])("a window narrower than the data still contains every tick", (lanesEvents) => {
    const data = lanesEvents.map((events, i) => ({ label: `l${i}`, events }));
    const geo = eventRasterGeometry({
      data,
      // deliberately narrower than the generated events: a caller overfetching
      // around a window is normal, and the out-of-window events used to be
      // scaled anyway and painted hundreds of units past the viewBox
      domain: [40, 60],
      width: 120,
      height: 48,
      gutter: 15,
      overflow: "clip",
    });
    geo.lanes.forEach((lane, i) => {
      for (const x of lane.path.matchAll(/M([\d.]+)/g)) {
        expect(Number(x[1])).toBeGreaterThanOrEqual(14.9);
        expect(Number(x[1])).toBeLessThanOrEqual(120.01);
      }
      // and the lane reports what it painted, not what it was handed
      expect(lane.count).toBe(lanesEvents[i]!.filter((e) => e >= 40 && e <= 60).length);
    });
  });

  test.prop([
    fc.array(fc.array(fc.integer({ min: 0, max: 100 }), { maxLength: 20 }), {
      minLength: 1,
      maxLength: 6,
    }),
  ])("ticks stay inside the plot area", (lanesEvents) => {
    const data = lanesEvents.map((events, i) => ({ label: `l${i}`, events }));
    const geo = eventRasterGeometry({
      data,
      domain: [0, 100],
      width: 120,
      height: 48,
      gutter: 15,
      overflow: "clip",
    });
    for (const lane of geo.lanes) {
      for (const x of lane.path.matchAll(/M([\d.]+)/g)) {
        expect(Number(x[1])).toBeGreaterThanOrEqual(14.9);
        expect(Number(x[1])).toBeLessThanOrEqual(120.01);
      }
    }
  });
});
