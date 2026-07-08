import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { waterfallGeometry } from "./geometry.js";

const base = { width: 70, height: 18, start: 0, total: true };

describe("waterfallGeometry (plan/22 #20)", () => {
  it("bars float at the running level; total bar anchors at zero", () => {
    const geo = waterfallGeometry({ ...base, start: 1200, deltas: [300, -140, 180] });
    expect(geo.levels).toEqual([1500, 1360, 1540]);
    expect(geo.totalBar).not.toBeNull();
    // the total spans zero → its level: y(0) is one edge
    const t = geo.totalBar!;
    expect(Math.abs(t.y + t.h - geo.zeroY) < 0.6 || Math.abs(t.y - geo.zeroY) < 0.6).toBe(true);
  });

  it("zero delta → a visible 1-unit tick at the level", () => {
    const geo = waterfallGeometry({ ...base, deltas: [100, 0, 50] });
    expect(geo.bars[1]!.h).toBe(1);
    expect(geo.bars[1]!.sign).toBe(0);
  });

  it("running level crossing zero straddles correctly", () => {
    const geo = waterfallGeometry({ ...base, deltas: [50, -120] });
    expect(geo.levels).toEqual([50, -70]);
    const b = geo.bars[1]!;
    expect(b.y).toBeLessThan(geo.zeroY);
    expect(b.y + b.h).toBeGreaterThan(geo.zeroY);
  });

  test.prop([
    fc.array(fc.double({ noNaN: true, min: -1e4, max: 1e4 }), { minLength: 1, maxLength: 7 }),
    fc.double({ noNaN: true, min: -1e4, max: 1e4 }),
    fc.boolean(),
  ])("containment: bars + connectors + total inside the box", (deltas, start, total) => {
    const geo = waterfallGeometry({ width: 70, height: 18, deltas, start, total });
    for (const b of [...geo.bars, ...(geo.totalBar ? [geo.totalBar] : [])]) {
      expect(b.x).toBeGreaterThanOrEqual(0);
      expect(b.x + b.w).toBeLessThanOrEqual(70.01);
      expect(b.y).toBeGreaterThanOrEqual(-0.6);
      expect(b.y + b.h).toBeLessThanOrEqual(18.6);
    }
    for (const c of geo.connectors) {
      expect(c.y).toBeGreaterThanOrEqual(0);
      expect(c.y).toBeLessThanOrEqual(18.01);
    }
  });
});
