import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { forecastConeGeometry, type ForecastInput } from "./geometry.js";

const base = { width: 80, height: 20 };
const HIST = [30, 32, 31, 34, 36, 35, 38];
const FC: ForecastInput = {
  mid: [39, 40, 41, 42],
  p80: [
    [36, 42],
    [35, 45],
    [34, 50],
    [33, 55],
  ],
  p50: [
    [37, 41],
    [37, 43],
    [36, 46],
    [35, 49],
  ],
};

describe("forecastConeGeometry", () => {
  it("history line + boundary + dashed mid + 2 bands", () => {
    const geo = forecastConeGeometry({ ...base, data: HIST, forecast: FC })!;
    expect(geo.history.d).toMatch(/^M/);
    expect(geo.mid.d).toMatch(/^M/);
    expect(geo.bands.map((b) => b.p)).toEqual([80, 50]); // faintest outer first
    expect(geo.landing.value).toBe(42);
    expect(geo.now).toBe(38);
  });

  it("caps at 2 bands — p50 omitted → a single band", () => {
    const geo = forecastConeGeometry({
      ...base,
      data: HIST,
      forecast: { mid: FC.mid, p80: FC.p80 },
    })!;
    expect(geo.bands.map((b) => b.p)).toEqual([80]);
  });

  it("horizon interval reported for the summary", () => {
    const geo = forecastConeGeometry({ ...base, data: HIST, forecast: FC })!;
    expect(geo.horizon).toEqual({ mid: 42, lo: 33, hi: 55 });
  });

  it("widening cone → widening true; non-widening → false (never auto-inflated)", () => {
    const geo = forecastConeGeometry({ ...base, data: HIST, forecast: FC })!;
    expect(geo.widening).toBe(true);
    const flat: ForecastInput = {
      mid: [39, 40, 41, 42],
      p80: [
        [30, 50],
        [33, 47],
        [35, 45],
        [37, 43],
      ], // narrows instead of widens
    };
    const geo2 = forecastConeGeometry({ ...base, data: HIST, forecast: flat })!;
    expect(geo2.widening).toBe(false);
  });

  it("reversed band pair (hi < lo) is swapped", () => {
    const rev: ForecastInput = { mid: [40], p80: [[50, 30]] };
    const geo = forecastConeGeometry({ ...base, data: HIST, forecast: rev })!;
    expect(geo.horizon.lo).toBe(30);
    expect(geo.horizon.hi).toBe(50);
  });

  it("empty history → cone only, boundary at the left edge, now null", () => {
    const geo = forecastConeGeometry({ ...base, data: [], forecast: FC })!;
    expect(geo.now).toBeNull();
    expect(geo.history.d).toBe("");
    expect(geo.boundary.x).toBeLessThan(base.width / 2);
  });

  it("target reference records its y", () => {
    const geo = forecastConeGeometry({ ...base, data: HIST, forecast: FC, target: 45 })!;
    expect(geo.target).not.toBeNull();
  });

  it("empty forecast → null", () => {
    expect(
      forecastConeGeometry({ ...base, data: HIST, forecast: { mid: [], p80: [] } }),
    ).toBeNull();
  });

  test.prop([
    fc.array(fc.double({ noNaN: true, min: 0, max: 100 }), { minLength: 0, maxLength: 20 }),
    fc.array(fc.double({ noNaN: true, min: 0, max: 100 }), { minLength: 1, maxLength: 12 }),
  ])("containment: history + mid inside the plot", (data, mid) => {
    const p80 = mid.map((v) => [v - 5, v + 5] as [number, number]);
    const geo = forecastConeGeometry({
      ...base,
      data,
      forecast: { mid, p80 },
      gutterCh: 4,
      fontSize: 8,
    });
    if (!geo) return;
    for (const d of [geo.history.d, geo.mid.d]) {
      const ys = [...d.matchAll(/[ML]-?[\d.]+ (-?[\d.]+)/g)].map((m) => Number(m[1]));
      for (const y of ys) {
        expect(y).toBeGreaterThanOrEqual(1.99);
        expect(y).toBeLessThanOrEqual(18.01);
      }
    }
  });
});
