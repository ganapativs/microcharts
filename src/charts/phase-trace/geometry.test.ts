import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { phaseTraceGeometry } from "./geometry.js";

const TRAJ = [
  { x: 30, y: 80 },
  { x: 35, y: 85 },
  { x: 42, y: 95 },
  { x: 50, y: 105 },
  { x: 55, y: 115 },
  { x: 58, y: 122 },
  { x: 62, y: 130 },
];

describe("phaseTraceGeometry (plan/25 §17, plan/17 F16)", () => {
  it("splits the trajectory into a muted trail + an accent tail with an arrow", () => {
    const geo = phaseTraceGeometry({
      data: TRAJ,
      xDomain: [30, 62],
      yDomain: [80, 130],
      tail: 0.25,
      width: 40,
      height: 32,
    });
    expect(geo.trailPath).toContain("M");
    expect(geo.tailPath).toContain("M");
    expect(geo.arrow).toContain("M");
    expect(geo.end).not.toBeNull();
  });

  it("heading reads up-right for a rising trajectory", () => {
    const geo = phaseTraceGeometry({
      data: TRAJ,
      xDomain: [30, 62],
      yDomain: [80, 130],
      tail: 0.25,
      width: 40,
      height: 32,
    });
    expect(geo.heading).toBe(0); // up-right
  });

  it("dedups coincident consecutive points", () => {
    const geo = phaseTraceGeometry({
      data: [
        { x: 1, y: 1 },
        { x: 1, y: 1 },
        { x: 2, y: 3 },
      ],
      xDomain: [1, 2],
      yDomain: [1, 3],
      tail: 0.25,
      width: 40,
      height: 32,
    });
    expect(geo.points.length).toBe(2);
  });

  test.prop([
    fc.array(
      fc.record({
        x: fc.double({ min: 0, max: 100, noNaN: true }),
        y: fc.double({ min: 0, max: 100, noNaN: true }),
      }),
      { minLength: 1, maxLength: 100 },
    ),
  ])("screen points stay inside the viewBox", (data) => {
    const geo = phaseTraceGeometry({
      data,
      xDomain: [0, 100],
      yDomain: [0, 100],
      tail: 0.25,
      width: 40,
      height: 32,
    });
    for (const p of geo.points) {
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThanOrEqual(40.01);
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeLessThanOrEqual(32.01);
    }
  });
});
