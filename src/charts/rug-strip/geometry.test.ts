import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { rugGeometry } from "./geometry.js";

const base = { length: 60, thickness: 10, orientation: "horizontal" as const };

/** Numeric tokens of a tier path, in emission order: pos, inset, far per tick. */
const coords = (d: string): number[] => (d.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);

describe("rugGeometry", () => {
  it("one tick per observation, sorted, positions inside the strip", () => {
    const geo = rugGeometry({ ...base, values: [9.7, 3.1, 5.2] });
    expect(geo.ticks.map((t) => t.value)).toEqual([3.1, 5.2, 9.7]);
    for (const t of geo.ticks) {
      expect(t.pos).toBeGreaterThanOrEqual(0);
      expect(t.pos).toBeLessThanOrEqual(60);
    }
  });

  it("never thins: 400 observations → 400 retained ticks", () => {
    const values = Array.from({ length: 400 }, (_, i) => (i * 37) % 101);
    const geo = rugGeometry({ ...base, values });
    expect(geo.ticks.length).toBe(400);
  });

  it("duplicates darken by tier: singles 0.35, pairs 0.6, 4+ 0.85", () => {
    const geo = rugGeometry({ ...base, values: [1, 5, 5, 9, 9, 9, 9] });
    expect(geo.tiers.map((t) => t.opacity).sort()).toEqual([0.35, 0.6, 0.85]);
  });

  it("a reversed domain is a window, not a mirrored axis", () => {
    const up = rugGeometry({ ...base, values: [2, 8], domain: [0, 10] });
    const down = rugGeometry({ ...base, values: [2, 8], domain: [10, 0] });
    expect(down.domain).toEqual([0, 10]);
    expect(down.ticks.map((t) => t.pos)).toEqual(up.ticks.map((t) => t.pos));
    // The interactive picker binary-searches these, so they must ascend.
    expect(down.ticks[0]!.pos).toBeLessThan(down.ticks[1]!.pos);
  });

  it("markValue resolves to a clamped position; non-finite → null", () => {
    const geo = rugGeometry({ ...base, values: [0, 10], markValue: 99 });
    expect(geo.highlightPos).toBeLessThanOrEqual(60);
    const none = rugGeometry({ ...base, values: [0, 10], markValue: Number.NaN });
    expect(none.highlightPos).toBeNull();
  });

  it("vertical orientation emits horizontal segments", () => {
    const geo = rugGeometry({ ...base, orientation: "vertical", values: [1, 2, 3] });
    expect(geo.tiers[0]!.d).toContain("H");
    expect(geo.tiers[0]!.d).not.toContain("V");
  });

  test.prop([
    fc.array(fc.double({ noNaN: true, min: -1e6, max: 1e6 }), { maxLength: 120 }),
    fc.option(fc.double({ noNaN: true, min: -1e6, max: 1e6 }), { nil: undefined }),
  ])("containment: every tick + markValue within [0, length]", (values, markValue) => {
    const geo = rugGeometry({ ...base, values, markValue });
    for (const t of geo.ticks) {
      expect(t.pos).toBeGreaterThanOrEqual(0);
      expect(t.pos).toBeLessThanOrEqual(60);
      expect(t.pos).toBe(Math.round(t.pos * 100) / 100);
    }
    if (geo.highlightPos !== null) {
      expect(geo.highlightPos).toBeGreaterThanOrEqual(0);
      expect(geo.highlightPos).toBeLessThanOrEqual(60);
    }
  });

  test.prop([
    fc.array(fc.double({ noNaN: true, min: -1e6, max: 1e6 }), { minLength: 1, maxLength: 40 }),
    // 0.5 is the floor the 2-dp coordinate grid can still express; `chartSide`
    // already rejects a non-positive box before geometry sees it.
    fc.double({ noNaN: true, min: 0.5, max: 200 }),
  ])("containment: tick ends stay inside a strip of any thickness", (values, thickness) => {
    const geo = rugGeometry({ ...base, thickness, values });
    for (const tier of geo.tiers) {
      coords(tier.d).forEach((n, i) => {
        // per tick: [pos on the value axis, near end, far end]
        const limit = i % 3 === 0 ? 60 : thickness;
        expect(n).toBeGreaterThanOrEqual(0);
        expect(n).toBeLessThanOrEqual(limit);
      });
    }
  });
});
