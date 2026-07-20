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

  test.prop([fc.integer({ min: 0, max: 1000 }), fc.integer({ min: 0, max: 50 })])(
    "orbit + satellite stay inside the box",
    (latency, rate) => {
      const geo = g(latency, rate);
      expect(geo.orbit.r).toBeLessThanOrEqual(geo.size / 2);
      expect(geo.satellite.cy - geo.satellite.r).toBeGreaterThanOrEqual(-0.6);
      expect(geo.satellite.cx + geo.satellite.r).toBeLessThanOrEqual(geo.size + 0.6);
    },
  );
});
