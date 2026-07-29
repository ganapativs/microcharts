import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { constellationGeometry } from "./geometry.js";

const g = (points: readonly { x: number; y?: number; m?: number }[], connect = true) =>
  constellationGeometry({ points, width: 60, height: 20, connect, rBase: 1.6, pad: 1 });

describe("constellationGeometry — sparse events", () => {
  it("one star per finite-x point; connector polyline in time order", () => {
    const geo = g([
      { x: 3, y: 5 },
      { x: 1, y: 8 },
      { x: 5, y: 2 },
    ]);
    expect(geo.stars.length).toBe(3);
    expect(geo.connectorPath).toMatch(/^M/);
    // connector starts at the earliest-x event (leftmost cx)
    const firstX = Number(geo.connectorPath!.match(/^M([\d.]+)/)![1]);
    const minCx = Math.min(...geo.stars.map((s) => s.cx));
    expect(firstX).toBeCloseTo(minCx, 1);
  });

  it("drops non-finite x", () => {
    expect(
      g([
        { x: 1, y: 2 },
        { x: NaN, y: 3 },
      ]).stars.length,
    ).toBe(1);
  });

  it("magnitude is area-true: r ∝ √m, monotonic in m", () => {
    const geo = g([
      { x: 1, y: 1, m: 1 },
      { x: 2, y: 1, m: 4 },
      { x: 3, y: 1, m: 9 },
    ]);
    const rs = geo.stars.map((s) => s.r);
    expect(rs[0]!).toBeLessThan(rs[1]!);
    expect(rs[1]!).toBeLessThan(rs[2]!);
    // r(4)/r(9) ≈ √(4/9) = 2/3
    expect(rs[1]! / rs[2]!).toBeCloseTo(2 / 3, 1);
  });

  it("no values → jittered layout (deterministic), largestIndex falls back", () => {
    const pts = [{ x: 1 }, { x: 2 }, { x: 3 }];
    const a = g(pts);
    const b = g(pts);
    expect(a.jittered).toBe(true);
    expect(a.stars.map((s) => s.cy)).toEqual(b.stars.map((s) => s.cy)); // seeded, stable
    expect(a.stars.every((s) => Number.isNaN(s.value))).toBe(true);
  });

  it("largest event = max magnitude", () => {
    const geo = g([
      { x: 1, y: 1, m: 2 },
      { x: 2, y: 9, m: 7 },
      { x: 3, y: 3, m: 4 },
    ]);
    expect(geo.largestIndex).toBe(1);
  });

  it("time is sacred: equal-x events share cx (never jittered on x)", () => {
    const geo = g([{ x: 4 }, { x: 4 }, { x: 4 }]);
    const cxs = new Set(geo.stars.map((s) => s.cx));
    expect(cxs.size).toBe(1);
  });

  it("connect=false or n<2 → no connector", () => {
    expect(
      g(
        [
          { x: 1, y: 1 },
          { x: 2, y: 2 },
        ],
        false,
      ).connectorPath,
    ).toBeNull();
    expect(g([{ x: 1, y: 1 }]).connectorPath).toBeNull();
  });

  it("value mode drops value-less points from the radius ramp and the time axis", () => {
    // The middle point has no y, so it can't be drawn — and must not size the
    // others (m=99 off-chart) or stretch x (it used to do both).
    const geo = g([
      { x: 0, y: 10, m: 1 },
      { x: 50, m: 99 },
      { x: 2, y: 5, m: 2 },
    ]);
    expect(geo.stars.map((s) => s.index)).toEqual([0, 2]);
    expect(geo.largestIndex).toBe(2); // biggest DRAWN magnitude
    expect(geo.stars[1]!.r).toBeGreaterThan(geo.stars[0]!.r); // ramp is m=1 vs m=2
    // x spans the drawn events only: the later one lands at the right edge
    expect(geo.stars[1]!.cx).toBeGreaterThan(geo.width / 2);
  });

  it("byMagnitude is false when no drawn magnitude is positive", () => {
    expect(
      g([
        { x: 0, y: 1, m: 0 },
        { x: 1, y: 2, m: -5 },
      ]).byMagnitude,
    ).toBe(false);
    expect(g([{ x: 0, y: 1, m: 2 }]).byMagnitude).toBe(true);
  });

  it("non-finite width/height/rBase fall back to the documented defaults", () => {
    for (const bad of [NaN, Infinity, -Infinity]) {
      const geo = constellationGeometry({
        points: [
          { x: 0, y: 1 },
          { x: 1, y: 2 },
        ],
        width: bad,
        height: bad,
        connect: true,
        rBase: bad,
        pad: 1,
      });
      expect(geo.width).toBe(60);
      expect(geo.height).toBe(20);
      for (const s of geo.stars) {
        expect(Number.isFinite(s.cx)).toBe(true);
        expect(Number.isFinite(s.cy)).toBe(true);
        expect(s.r).toBeGreaterThan(0);
      }
    }
    // a non-positive radius paints nothing (r="0" / an invalid r="-1")
    expect(g([{ x: 0, y: 1 }]).stars[0]!.r).toBe(
      constellationGeometry({
        points: [{ x: 0, y: 1 }],
        width: 60,
        height: 20,
        connect: true,
        rBase: -1,
        pad: 1,
      }).stars[0]!.r,
    );
  });

  it("empty → no stars, no connector", () => {
    const geo = g([]);
    expect(geo.stars.length).toBe(0);
    expect(geo.connectorPath).toBeNull();
  });

  test.prop([
    fc.array(
      fc.record({
        x: fc.integer({ min: 0, max: 100 }),
        y: fc.integer({ min: -50, max: 50 }),
        m: fc.integer({ min: 0, max: 20 }),
      }),
      { minLength: 1, maxLength: 12 },
    ),
  ])("every star stays inside the box", (points) => {
    const geo = g(points);
    for (const s of geo.stars) {
      expect(s.cx - s.r).toBeGreaterThanOrEqual(-0.5);
      expect(s.cx + s.r).toBeLessThanOrEqual(geo.width + 0.5);
      expect(s.cy - s.r).toBeGreaterThanOrEqual(-0.5);
      expect(s.cy + s.r).toBeLessThanOrEqual(geo.height + 0.5);
    }
  });
});
