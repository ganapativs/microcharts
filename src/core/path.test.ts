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
