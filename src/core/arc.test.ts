import { describe, it, expect } from "vitest";
import { test, fc } from "@fast-check/vitest";
import {
  TAU,
  polarPoint,
  arcTo,
  arcPath,
  sector,
  annulusSector,
  arcLength,
  evenDashes,
} from "./arc.js";

const angle = fc.double({ noNaN: true, min: -TAU, max: TAU });
const radius = fc.double({ noNaN: true, min: 0.5, max: 500 });
const sweep = fc.double({ noNaN: true, min: 0.01, max: TAU });

/** All numeric tokens in a path `d` string. */
const nums = (d: string): number[] => (d.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);

describe("polarPoint", () => {
  it("12 o'clock start, clockwise", () => {
    expect(polarPoint(12, 12, 10, 0)).toEqual([12, 2]); // up
    expect(polarPoint(12, 12, 10, TAU / 4)).toEqual([22, 12]); // right
    expect(polarPoint(12, 12, 10, TAU / 2)).toEqual([12, 22]); // down
    expect(polarPoint(12, 12, 10, (3 * TAU) / 4)).toEqual([2, 12]); // left
  });

  test.prop([radius, angle])("stays on the circle (2-dp tolerance)", (r, a) => {
    const [x, y] = polarPoint(0, 0, r, a);
    expect(Math.hypot(x, y)).toBeCloseTo(r, 1);
  });
});

describe("arcTo", () => {
  it("emits a 2-dp A command", () => {
    expect(arcTo(10.123, 5.456, 0, true, false, 1.005, 2)).toBe("A10.12 5.46 0 1 0 1 2");
  });
});

describe("arcPath / sector / annulusSector (edge matrix)", () => {
  it("zero or negative sweep → empty path (no zero-length artifact)", () => {
    expect(arcPath(12, 12, 10, 1, 1)).toBe("");
    expect(sector(12, 12, 10, 2, 1)).toBe("");
    expect(annulusSector(12, 12, 10, 6, 0, 0)).toBe("");
  });

  it("non-finite or non-positive radius → empty path", () => {
    expect(arcPath(12, 12, 0, 0, 1)).toBe("");
    expect(arcPath(12, 12, NaN, 0, 1)).toBe("");
    expect(sector(12, 12, -3, 0, 1)).toBe("");
    expect(arcPath(12, 12, 10, NaN, 1)).toBe("");
  });

  it("full sweep is built from half-arcs — never a single 360° arc", () => {
    const full = arcPath(12, 12, 10, 0, TAU);
    expect(full.match(/A/g)).toHaveLength(2);
    expect(sector(12, 12, 10, 0, TAU).match(/A/g)).toHaveLength(2);
  });

  it("full annulus emits two subpaths (outer + reversed inner hole)", () => {
    const d = annulusSector(12, 12, 10, 6, 0, TAU);
    expect(d.match(/M/g)).toHaveLength(2);
    expect(d.match(/A/g)).toHaveLength(4);
    expect(d.match(/Z/g)).toHaveLength(2);
  });

  it("partial sector starts at the center; partial annulus does not", () => {
    expect(sector(12, 12, 10, 0, 1)).toMatch(/^M12 12 L/);
    expect(annulusSector(12, 12, 10, 6, 0, 1)).not.toContain("M12 12 ");
  });

  it("rInner 0 (or negative/NaN) collapses to a plain sector", () => {
    expect(annulusSector(12, 12, 10, 0, 0, 1)).toBe(sector(12, 12, 10, 0, 1));
    expect(annulusSector(12, 12, 10, -2, 0, 1)).toBe(sector(12, 12, 10, 0, 1));
  });

  it("rInner is clamped to rOuter", () => {
    expect(annulusSector(12, 12, 10, 99, 0, 1)).toBe(annulusSector(12, 12, 10, 10, 0, 1));
  });

  it("sweep beyond one turn is clamped", () => {
    expect(arcPath(12, 12, 10, 0, 3 * TAU)).toBe(arcPath(12, 12, 10, 0, TAU));
  });
});

describe("arc builders (invariants)", () => {
  test.prop([radius, angle, sweep])(
    "every coord is 2-dp and stays within cx/cy ± r",
    (r, a0, s) => {
      const cx = 60;
      const cy = 60;
      for (const d of [
        arcPath(cx, cy, r, a0, a0 + s),
        sector(cx, cy, r, a0, a0 + s),
        annulusSector(cx, cy, r, r / 2, a0, a0 + s),
      ]) {
        expect(d).not.toBe("");
        for (const n of nums(d)) {
          expect(n).toBe(Math.round(n * 100) / 100);
        }
        // coordinate tokens (skip the A radii/flags) all sit inside the disc;
        // cheap containment: no token may exceed center + r + rounding slack
        const tokens = nums(d);
        for (const n of tokens) {
          expect(Math.abs(n)).toBeLessThanOrEqual(Math.max(cx, cy) + r + 0.01);
        }
      }
    },
  );

  test.prop([radius, angle, sweep])("arc endpoints land on the circle", (r, a0, s) => {
    const d = arcPath(0, 0, r, a0, a0 + s);
    const t = nums(d);
    // first two tokens = start point
    expect(Math.hypot(t[0]!, t[1]!)).toBeCloseTo(r, 1);
    // last two tokens = end point
    expect(Math.hypot(t[t.length - 2]!, t[t.length - 1]!)).toBeCloseTo(r, 1);
  });
});

describe("arcLength / evenDashes", () => {
  it("quarter turn", () => expect(arcLength(10, 0, TAU / 4)).toBeCloseTo(15.71, 2));
  it("degenerate → 0", () => {
    expect(arcLength(0, 0, 1)).toBe(0);
    expect(arcLength(10, 1, 1)).toBe(0);
    expect(arcLength(NaN, 0, 1)).toBe(0);
  });
  it("clamps to one turn", () => expect(arcLength(1, 0, 5 * TAU)).toBeCloseTo(TAU, 2));

  it("dash + gap × count ≈ circumference", () => {
    const [dash, gap] = evenDashes(10, 8);
    expect((dash + gap) * 8).toBeCloseTo(TAU * 10, 0);
    expect(dash).toBe(gap); // duty 0.5
  });

  it("degenerate → [0, 0]", () => {
    expect(evenDashes(0, 8)).toEqual([0, 0]);
    expect(evenDashes(10, 0)).toEqual([0, 0]);
    expect(evenDashes(NaN, 4)).toEqual([0, 0]);
  });

  test.prop([radius, fc.integer({ min: 1, max: 60 }), fc.double({ min: 0, max: 1, noNaN: true })])(
    "duty splits the segment; both parts non-negative and 2-dp",
    (r, count, duty) => {
      const [dash, gap] = evenDashes(r, count, duty);
      expect(dash).toBeGreaterThanOrEqual(0);
      expect(gap).toBeGreaterThanOrEqual(0);
      expect(dash).toBe(Math.round(dash * 100) / 100);
      expect(gap).toBe(Math.round(gap * 100) / 100);
      expect(dash + gap).toBeCloseTo((TAU * r) / count, 1);
    },
  );
});
