import { describe, it, expect } from "vitest";
import { test, fc } from "@fast-check/vitest";
import { linePath, stepPath, smoothPath, areaPath } from "./path.js";
import type { XY } from "./types.js";

const coord = fc.double({ noNaN: true, noDefaultInfinity: true, min: -1e4, max: 1e4 });
const point: fc.Arbitrary<XY> = fc.tuple(coord, coord);

describe("linePath (edge matrix)", () => {
  it('empty → ""', () => expect(linePath([])).toBe(""));
  it("single point → move only", () => expect(linePath([[1, 2]])).toBe("M1 2"));
  it("two points → M…L…", () =>
    expect(
      linePath([
        [0, 0],
        [10, 5],
      ]),
    ).toBe("M0 0 L10 5"));

  it("null gap splits into two subpaths", () => {
    const d = linePath([[0, 0], [1, 1], null, [3, 3], [4, 4]]);
    expect(d.match(/M/g)).toHaveLength(2);
    expect(d).toBe("M0 0 L1 1 M3 3 L4 4");
  });

  it("leading/trailing/all nulls", () => {
    expect(linePath([null, [1, 1], null])).toBe("M1 1");
    expect(linePath([null, null])).toBe("");
  });
});

describe("coordinate rounding", () => {
  it("no coordinate exceeds 2 decimals", () => {
    const d = linePath([
      [0.123456, 9.87654],
      [1.005, 2.999],
    ]);
    for (const num of d.match(/-?\d+\.?\d*/g) ?? []) {
      const dec = num.split(".")[1];
      if (dec) expect(dec.length).toBeLessThanOrEqual(2);
    }
  });
});

describe("all builders (invariants)", () => {
  test.prop([fc.array(point, { minLength: 1 })])("never emit NaN/Infinity", (pts) => {
    for (const d of [linePath(pts), stepPath(pts), smoothPath(pts), areaPath(pts, 0)]) {
      expect(d).not.toMatch(/NaN|Infinity/);
    }
  });

  test.prop([fc.array(point, { minLength: 1 })])("start with a move command", (pts) => {
    expect(linePath(pts).startsWith("M")).toBe(true);
    expect(stepPath(pts).startsWith("M")).toBe(true);
    expect(smoothPath(pts).startsWith("M")).toBe(true);
  });
});

describe("smoothPath", () => {
  it("< 3 points falls back to straight segments", () => {
    expect(
      smoothPath([
        [0, 0],
        [2, 2],
      ]),
    ).toBe("M0 0 L2 2");
  });
  it("≥ 3 points uses cubic béziers", () => {
    expect(
      smoothPath([
        [0, 0],
        [1, 2],
        [2, 0],
      ]),
    ).toContain("C");
  });

  // Honest encoding: a smoothed series may never paint a value the data does
  // not contain. Uniform Catmull-Rom did (it overshot a V-shaped run by 1.33
  // units on a 20-unit-tall spark); the monotone tangents make it impossible.
  const yRange = (d: string): [number, number] => {
    let lo = Infinity;
    let hi = -Infinity;
    let cur: [number, number] = [0, 0];
    for (const seg of d.matchAll(/([MLC])([-\d. ]+)/g)) {
      const nums = seg[2]!.trim().split(/\s+/).map(Number);
      if (seg[1] === "C") {
        const [c1x, c1y, c2x, c2y, x, y] = nums as [number, number, number, number, number, number];
        // Sample the cubic itself, not its control points — a control point may
        // sit outside the hull the curve actually reaches.
        for (let t = 0; t <= 1.0001; t += 0.02) {
          const u = 1 - t;
          const py = u * u * u * cur[1] + 3 * u * u * t * c1y + 3 * u * t * t * c2y + t * t * t * y;
          lo = Math.min(lo, py);
          hi = Math.max(hi, py);
        }
        void c1x;
        void c2x;
        cur = [x, y];
      } else {
        cur = [nums[0]!, nums[1]!];
        lo = Math.min(lo, cur[1]);
        hi = Math.max(hi, cur[1]);
      }
    }
    return [lo, hi];
  };

  it("never overshoots the data's own y-range (the V that used to break)", () => {
    const pts: XY[] = [
      [0, 20],
      [26, 2],
      [53, 20],
      [80, 20],
    ];
    const [lo, hi] = yRange(smoothPath(pts));
    expect(hi).toBeLessThanOrEqual(20 + 0.01);
    expect(lo).toBeGreaterThanOrEqual(2 - 0.01);
  });

  test.prop([
    fc.array(fc.double({ noNaN: true, min: -1e3, max: 1e3 }), { minLength: 3, maxLength: 40 }),
  ])("stays inside [min(y), max(y)] for any series on an index axis", (ys) => {
    const pts: XY[] = ys.map((y, i) => [i, y]);
    let dataLo = Infinity;
    let dataHi = -Infinity;
    for (const y of ys) {
      if (y < dataLo) dataLo = y;
      if (y > dataHi) dataHi = y;
    }
    const [lo, hi] = yRange(smoothPath(pts));
    // 0.01 slack: coordinates are 2-dp rounded at generation.
    expect(lo).toBeGreaterThanOrEqual(dataLo - 0.02);
    expect(hi).toBeLessThanOrEqual(dataHi + 0.02);
  });
});

describe("areaPath", () => {
  it("closes each run with Z down to the baseline", () => {
    const d = areaPath(
      [
        [0, 5],
        [10, 2],
      ],
      20,
    );
    expect(d.startsWith("M0 20")).toBe(true);
    expect(d.endsWith("Z")).toBe(true);
    expect(d).toContain("L10 20");
  });
  it('empty → ""', () => expect(areaPath([], 0)).toBe(""));
});
