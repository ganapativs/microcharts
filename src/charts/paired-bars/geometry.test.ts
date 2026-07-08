import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { pairedBarsGeometry } from "./geometry.js";

const base = { width: 60, height: 20, mode: "grouped" as const, orientation: "vertical" as const };

describe("pairedBarsGeometry (plan/22 #12)", () => {
  it("value + ref share ONE zero-anchored domain (auto: max of both)", () => {
    const geo = pairedBarsGeometry({ ...base, pairs: [{ value: 50, ref: 100 }] });
    const v = geo.pairs[0]!.valueRect!;
    const r = geo.pairs[0]!.refRect!;
    expect(v.h).toBeCloseTo(r.h / 2, 1); // same scale
  });

  it("grouped: ref bar is slimmer (the second structural mute cue)", () => {
    const geo = pairedBarsGeometry({ ...base, pairs: [{ value: 50, ref: 50 }] });
    expect(geo.pairs[0]!.refRect!.w).toBeLessThan(geo.pairs[0]!.valueRect!.w);
  });

  it("overlay: ref spans the full band behind a narrower value bar", () => {
    const geo = pairedBarsGeometry({ ...base, mode: "overlay", pairs: [{ value: 50, ref: 50 }] });
    expect(geo.pairs[0]!.refRect!.w).toBeGreaterThan(geo.pairs[0]!.valueRect!.w);
    expect(geo.pairs[0]!.refRect!.x).toBeLessThanOrEqual(geo.pairs[0]!.valueRect!.x);
  });

  it("null ref → value bar alone", () => {
    const geo = pairedBarsGeometry({ ...base, pairs: [{ value: 50, ref: null }] });
    expect(geo.pairs[0]!.valueRect).not.toBeNull();
    expect(geo.pairs[0]!.refRect).toBeNull();
  });

  test.prop([
    fc.array(
      fc.record({
        value: fc.option(fc.double({ noNaN: true, min: -1e4, max: 1e4 }), { nil: null }),
        ref: fc.option(fc.double({ noNaN: true, min: -1e4, max: 1e4 }), { nil: null }),
      }),
      { minLength: 1, maxLength: 5 },
    ),
    fc.constantFrom<"grouped" | "overlay">("grouped", "overlay"),
    fc.constantFrom<"horizontal" | "vertical">("horizontal", "vertical"),
  ])("containment: all rects inside the box", (pairs, mode, orientation) => {
    const geo = pairedBarsGeometry({ width: 60, height: 20, pairs, mode, orientation });
    for (const p of geo.pairs) {
      for (const rect of [p.valueRect, p.refRect]) {
        if (!rect) continue;
        expect(rect.x).toBeGreaterThanOrEqual(-0.01);
        expect(rect.y).toBeGreaterThanOrEqual(-0.01);
        expect(rect.x + rect.w).toBeLessThanOrEqual(60.01);
        expect(rect.y + rect.h).toBeLessThanOrEqual(20.01);
      }
    }
  });
});
