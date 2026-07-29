import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { DEFAULT_HEIGHT, DEFAULT_WIDTH, phaseTraceGeometry } from "./geometry.js";

const TRAJ = [
  { x: 30, y: 80 },
  { x: 35, y: 85 },
  { x: 42, y: 95 },
  { x: 50, y: 105 },
  { x: 55, y: 115 },
  { x: 58, y: 122 },
  { x: 62, y: 130 },
];

describe("phaseTraceGeometry", () => {
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

  // Hostile CONFIG props: a bad scalar used to paint NaN (or, for `[0, NaN]`, a
  // trace 2200 units wide) under a summary that read perfectly normally.
  describe("rejects a config prop it cannot project, and falls back to the default", () => {
    const at = (over: Partial<Parameters<typeof phaseTraceGeometry>[0]>) =>
      phaseTraceGeometry({
        data: TRAJ,
        tail: 0.25,
        width: 40,
        height: 32,
        ...over,
      });
    const fitted = at({});
    const coords = (g: ReturnType<typeof phaseTraceGeometry>) =>
      [g.trailPath, g.tailPath, g.arrow].join(" ");

    for (const [label, bad] of [
      ["both ends NaN", [NaN, NaN]],
      ["one end NaN", [0, NaN]],
      ["infinite ends", [-Infinity, Infinity]],
      // Finite ends whose difference overflows: Infinity / Infinity is NaN.
      ["overflowing span", [-1e308, 1e308]],
      ["zero span", [5, 5]],
    ] as const) {
      it(`${label} on either axis → the fitted extent`, () => {
        expect(at({ xDomain: bad })).toEqual(fitted);
        expect(at({ yDomain: bad })).toEqual(fitted);
      });
    }

    it("a reversed domain is the same window, so heading and paint agree", () => {
      expect(at({ yDomain: [130, 80] })).toEqual(at({ yDomain: [80, 130] }));
    });

    it("a non-finite box falls back to the documented one, not to NaN coords", () => {
      const box = at({ width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT });
      for (const bad of [NaN, Infinity, 0, -10]) {
        expect(at({ width: bad })).toEqual(box);
        expect(at({ height: bad })).toEqual(box);
      }
    });

    it("a non-finite tail keeps the trail/tail split instead of accenting everything", () => {
      for (const bad of [NaN, Infinity, -Infinity]) {
        const geo = at({ tail: bad });
        expect(geo.trailPath).toBe(fitted.trailPath);
        expect(geo.tailPath).toBe(fitted.tailPath);
        expect(geo.heading).toBe(fitted.heading); // was 4 (steady) over a rising trace
      }
    });

    it("readings past the float range centre rather than emit NaN", () => {
      const geo = at({
        data: [
          { x: 1e308, y: -1e308 },
          { x: -1e308, y: 1e308 },
        ],
      });
      expect(coords(geo)).not.toMatch(/NaN|Infinity/);
      expect(geo.points.every((p) => Number.isFinite(p.x) && Number.isFinite(p.y))).toBe(true);
    });
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
