import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { cometTrailGeometry } from "./geometry.js";

const g = (values: readonly number[], trail = 12) =>
  cometTrailGeometry({ values, width: 60, height: 16, trail, pad: 1 });

describe("cometTrailGeometry — rolling window", () => {
  it("head sits at the newest value on the right; trail is the prior points", () => {
    const geo = g([10, 20, 30, 40]);
    expect(geo.head!.index).toBe(3);
    expect(geo.count).toBe(4);
    expect(geo.trail.length).toBe(3);
    // head is the rightmost mark
    expect(geo.head!.cx).toBeGreaterThan(Math.max(...geo.trail.map((t) => t.cx)));
  });

  it("trail is newest-first with age-decreasing opacity", () => {
    const geo = g([1, 2, 3, 4, 5, 6]);
    expect(geo.trail[0]!.opacity).toBeGreaterThan(geo.trail[geo.trail.length - 1]!.opacity);
  });

  it("opacity encodes age, not value (a low recent point is still bright)", () => {
    const geo = g([100, 1, 100]); // middle (recent prior) is low but newest prior
    // trail[0] is the most-recent prior (value 1) — brightest despite low value
    expect(geo.trail[0]!.opacity).toBeGreaterThanOrEqual(geo.trail[1]?.opacity ?? 0);
  });

  it("trail length is context — the head value is unchanged by it", () => {
    expect(g([5, 6, 7, 8, 9], 2).last).toBe(g([5, 6, 7, 8, 9], 12).last);
  });

  it("respects the trail cap (20)", () => {
    const geo = g(
      Array.from({ length: 40 }, (_, i) => i),
      100,
    );
    expect(geo.trail.length).toBeLessThanOrEqual(20);
  });

  it("single point → head only, no trail", () => {
    const geo = g([42]);
    expect(geo.head!.index).toBe(0);
    expect(geo.trail.length).toBe(0);
  });

  it("empty → null head", () => {
    expect(g([]).head).toBeNull();
  });

  it("trend from first to last of the shown window", () => {
    expect(g([1, 2, 3]).trend).toBe(1);
    expect(g([3, 2, 1]).trend).toBe(-1);
    expect(g([5, 5, 5]).trend).toBe(0);
  });

  test.prop([fc.array(fc.integer({ min: -50, max: 50 }), { minLength: 1, maxLength: 30 })])(
    "every mark stays inside the box",
    (values) => {
      const geo = g(values);
      const marks = [...geo.trail, ...(geo.head ? [geo.head] : [])];
      for (const m of marks) {
        expect(m.cx - m.r).toBeGreaterThanOrEqual(-0.6);
        expect(m.cx + m.r).toBeLessThanOrEqual(geo.width + 0.6);
        expect(m.cy - m.r).toBeGreaterThanOrEqual(-0.6);
        expect(m.cy + m.r).toBeLessThanOrEqual(geo.height + 0.6);
      }
    },
  );
});
