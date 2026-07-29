import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { orbitStatusGeometry } from "./geometry.js";

const g = (
  latency: number,
  rate: number,
  extra: Partial<Parameters<typeof orbitStatusGeometry>[0]> = {},
) =>
  orbitStatusGeometry({
    latency,
    rate,
    size: 20,
    latencyDomain: [0, 500],
    rateDomain: [0, 20],
    pad: 1,
    ...extra,
  });

describe("orbitStatusGeometry — two live variables", () => {
  it("orbit radius grows with latency", () => {
    expect(g(100, 5).orbit.r).toBeLessThan(g(400, 5).orbit.r);
  });

  it("rate quantizes to 5 dash steps; rate 0 → a solid (dash-free) orbit", () => {
    expect(g(200, 0).orbit.rateStep).toBe(0);
    expect(g(200, 0).orbit.dash).toEqual([0, 0]);
    expect(g(200, 20).orbit.rateStep).toBe(5);
    expect(g(200, 20).orbit.dash[0]).toBeGreaterThan(0);
    expect(g(200, 4).orbit.rateStep).toBeGreaterThanOrEqual(1);
  });

  it("threshold → the satellite doubles and flags", () => {
    const calm = g(200, 5, { threshold: 300 });
    const hot = g(350, 5, { threshold: 300 });
    expect(calm.satellite.alerted).toBe(false);
    expect(hot.satellite.alerted).toBe(true);
    expect(hot.satellite.r).toBeGreaterThan(calm.satellite.r);
  });

  it("the satellite sits at the top (angle encodes nothing)", () => {
    const geo = g(300, 5);
    expect(geo.satellite.cy).toBeLessThan(geo.center.cy); // above the center
    expect(geo.satellite.cx).toBeCloseTo(geo.center.cx, 1); // directly above
  });

  it("NaN latency/rate → unknown", () => {
    expect(g(NaN, 5).unknown).toBe(true);
    expect(g(200, NaN).unknown).toBe(true);
  });

  test.prop([
    fc.integer({ min: 0, max: 1000 }),
    fc.integer({ min: 0, max: 50 }),
    fc.integer({ min: 1, max: 200 }),
    fc.option(fc.integer({ min: 0, max: 1000 }), { nil: undefined }),
  ])("orbit + satellite stay inside the box at every size", (latency, rate, size, threshold) => {
    const geo = g(latency, rate, { size, threshold, latencyDomain: undefined });
    expect(geo.orbit.r).toBeGreaterThanOrEqual(0);
    expect(geo.orbit.r).toBeLessThanOrEqual(geo.size / 2);
    // Zero tolerance: the satellite rides ON the orbit, and the outer bound
    // reserves its full (possibly alerted, possibly size-scaled) radius.
    expect(geo.satellite.cy - geo.satellite.r).toBeGreaterThanOrEqual(0);
    expect(geo.satellite.cy + geo.satellite.r).toBeLessThanOrEqual(geo.size);
    expect(geo.satellite.cx - geo.satellite.r).toBeGreaterThanOrEqual(0);
    expect(geo.satellite.cx + geo.satellite.r).toBeLessThanOrEqual(geo.size);
  });

  it("an alerted satellite at the top of the domain stays inside the box", () => {
    // The reserve used to be a fixed 1 unit while the satellite grew with
    // `size` and doubled on alert, so the default box hung it 0.4 units above
    // the viewBox — `.mc-root` is `overflow: visible`, so that painted.
    const geo = g(500, 5, { threshold: 100 });
    expect(geo.satellite.alerted).toBe(true);
    expect(geo.satellite.cy - geo.satellite.r).toBeGreaterThanOrEqual(0);
  });

  it("crossing the threshold never pulls the orbit inward", () => {
    // The radius scale reserves for the LARGEST satellite the chart can draw,
    // so it does not change under the chart as latency rises past the alert.
    const below = g(299, 5, { threshold: 300 });
    const above = g(301, 5, { threshold: 300 });
    expect(above.orbit.r).toBeGreaterThan(below.orbit.r);
  });

  it("hostile `size` resolves to the documented box, never NaN coords", () => {
    for (const size of [NaN, Infinity, -Infinity]) {
      const geo = g(240, 12, { size });
      expect(geo.size).toBe(20);
      expect(geo.orbit.cx).toBe(10);
    }
    // Non-positive floors at 1 (the family's `resolveSize`), and every
    // coordinate is laid out against the resolved box — not the raw prop.
    for (const size of [0, -20]) {
      const geo = g(240, 12, { size });
      expect(geo.size).toBe(1);
      expect(geo.orbit.cx).toBe(0.5);
      expect(geo.orbit.r).toBeGreaterThanOrEqual(0);
      expect(geo.center.r).toBeGreaterThanOrEqual(0);
    }
  });
});
