import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { percentileLadderGeometry } from "./geometry.js";

const base = { width: 80, height: 12 };
const SAMPLE = Array.from({ length: 101 }, (_, i) => i); // 0..100

describe("percentileLadderGeometry", () => {
  it("ticks at the chosen percentiles, tail highest emphasis", () => {
    const geo = percentileLadderGeometry({ ...base, data: SAMPLE })!;
    expect(geo.ticks.map((t) => t.p)).toEqual([50, 90, 99]);
    expect(geo.ticks.map((t) => t.value)).toEqual([50, 90, 99]);
    expect(geo.ticks[2]!.emphasis).toBe(2);
    expect(geo.ratio).toBe(1.98);
  });

  it("zero-anchored linear track — the origin is never cropped", () => {
    const geo = percentileLadderGeometry({ ...base, data: [50, 60, 70, 200] })!;
    // p50 sits well right of the pad; distances-from-zero carry the story
    expect(geo.track.x0).toBeCloseTo(3, 1);
    expect(geo.ticks[0]!.x).toBeGreaterThan(geo.track.x0);
  });

  it("ps sorted + deduped + capped at 4", () => {
    const geo = percentileLadderGeometry({ ...base, data: SAMPLE, ps: [99, 50, 99, 90, 25] })!;
    expect(geo.ticks.map((t) => t.p)).toEqual([25, 50, 90, 99]);
  });

  it("percentiles outside (0, 100) drop — announced scale is the painted one", () => {
    // `quantiles` clamps p into the sample, so a p200 tick painted the maximum
    // while the summary announced "p200 … the slowest -100%".
    const geo = percentileLadderGeometry({ ...base, data: SAMPLE, ps: [-10, 50, 200] })!;
    expect(geo.ticks.map((t) => t.p)).toEqual([50]);
  });

  it("a ps that filters down to nothing falls back to the default, not to no-data", () => {
    for (const ps of [[], [0, 100], [NaN]]) {
      const geo = percentileLadderGeometry({ ...base, data: SAMPLE, ps })!;
      expect(geo.ticks.map((t) => t.p)).toEqual([50, 90, 99]);
    }
  });

  it("ratio is the tail over the sample MEDIAN, whatever the lowest tick is", () => {
    // "× the median" in the summary means p50: the old last/first quotient
    // announced p90/p25 under the median's name.
    const geo = percentileLadderGeometry({ ...base, data: SAMPLE, ps: [25, 90] })!;
    expect(geo.median).toBe(50);
    expect(geo.ratio).toBe(1.8);
  });

  it("one requested percentile is not 'all percentiles equal'", () => {
    const geo = percentileLadderGeometry({ ...base, data: SAMPLE, ps: [90] })!;
    expect(geo.collapsed).toBe(false);
    expect(geo.ticks.map((t) => t.p)).toEqual([90]);
  });

  it("log applies only when every value > 0; else falls back", () => {
    const applied = percentileLadderGeometry({ ...base, data: [1, 10, 100, 1000], scale: "log" })!;
    expect(applied.log).toBe(true);
    const fallback = percentileLadderGeometry({ ...base, data: [0, 10, 100], scale: "log" })!;
    expect(fallback.log).toBe(false);
  });

  it("all-equal → collapsed, ratio guarded", () => {
    const geo = percentileLadderGeometry({ ...base, data: [7, 7, 7, 7] })!;
    expect(geo.collapsed).toBe(true);
  });

  it("empty → null", () => {
    expect(percentileLadderGeometry({ ...base, data: [null, null] })).toBeNull();
  });

  it("denormal inputs keep ratio finite (round2 must not overflow)", () => {
    // regression: a tiny p50 made p99/p50 ≈ 1.8e306; round2 (×100 first)
    // overflowed to Infinity past the finiteness guard on the raw quotient
    const geo = percentileLadderGeometry({
      ...base,
      data: [9.06e-18, 5e-324, 0],
      scale: "linear",
    })!;
    expect(Number.isFinite(geo.ratio)).toBe(true);
  });

  test.prop([
    fc.array(fc.double({ noNaN: true, min: -1e4, max: 1e4 }), { minLength: 1, maxLength: 80 }),
    fc.constantFrom<"linear" | "log">("linear", "log"),
  ])("containment: ticks inside the box; ratio finite", (data, scale) => {
    const geo = percentileLadderGeometry({ ...base, data, scale });
    if (!geo) return;
    for (const t of geo.ticks) {
      expect(t.x).toBeGreaterThanOrEqual(-0.01);
      expect(t.x).toBeLessThanOrEqual(80.01);
    }
    expect(Number.isFinite(geo.ratio)).toBe(true);
  });
});
