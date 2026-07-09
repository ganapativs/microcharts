import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { fatDigitsGeometry, fatTier } from "./geometry.js";

describe("fatTier (plan/24 #4) — ordinal weight tiers", () => {
  it("maps value through domain to a tier (5 steps)", () => {
    expect(fatTier(0, [0, 100], 5)).toEqual({ weight: 300, tier: 1 });
    expect(fatTier(50, [0, 100], 5)).toEqual({ weight: 600, tier: 3 });
    expect(fatTier(100, [0, 100], 5)).toEqual({ weight: 900, tier: 5 });
  });

  it("clamps outside the domain (numeral stays exact elsewhere)", () => {
    expect(fatTier(200, [0, 100], 5).tier).toBe(5);
    expect(fatTier(-50, [0, 100], 5).tier).toBe(1);
  });

  it("no domain → the middle tier", () => {
    expect(fatTier(999, undefined, 5).tier).toBe(3);
    expect(fatTier(999, undefined, 3).tier).toBe(2);
  });

  it("3-tier table", () => {
    expect(fatTier(0, [0, 100], 3)).toEqual({ weight: 400, tier: 1 });
    expect(fatTier(100, [0, 100], 3)).toEqual({ weight: 750, tier: 3 });
  });

  test.prop([fc.integer({ min: -500, max: 500 })])("tier always in 1..tiers", (v) => {
    const t = fatTier(v, [0, 100], 5).tier;
    expect(t).toBeGreaterThanOrEqual(1);
    expect(t).toBeLessThanOrEqual(5);
  });
});

describe("fatDigitsGeometry", () => {
  const base = { value: 1204, domain: [0, 1500] as const, tiers: 5 as const, fontSize: 14, pad: 2 };

  it("value mode → one weighted numeral", () => {
    const r = fatDigitsGeometry({ ...base, formatted: "1,204", encode: "value" });
    expect(r.text).toBeDefined();
    expect(r.glyphs).toBeUndefined();
    expect(r.text!.str).toBe("1,204");
  });

  it("digit mode → per-digit weights, big digits heavier", () => {
    const r = fatDigitsGeometry({ ...base, formatted: "1902", encode: "digit" });
    expect(r.glyphs!.length).toBe(4);
    const nine = r.glyphs!.find((g) => g.char === "9")!;
    const zero = r.glyphs!.find((g) => g.char === "0")!;
    expect(nine.weight).toBeGreaterThan(zero.weight);
  });

  it("stays within the box", () => {
    const r = fatDigitsGeometry({ ...base, formatted: "1,204", encode: "value" });
    expect(r.x).toBeGreaterThanOrEqual(0);
    expect(r.width).toBeGreaterThan(r.x);
  });
});
