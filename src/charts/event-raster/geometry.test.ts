import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { eventRasterGeometry, rasterDomain, LANE_CAP } from "./geometry.js";

const RASTER = [
  { label: "api", events: [2, 5, 9, 14, 20, 26, 33, 40, 48] },
  { label: "db", events: [3, 6, 10, 15, 21, 27, 34] },
  { label: "cache", events: [5, 20, 40] },
];

describe("eventRasterGeometry (plan/25 §5, plan/17 F18)", () => {
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
