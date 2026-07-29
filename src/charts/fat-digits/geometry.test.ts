import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { fatDigitsGeometry, fatTier, resolveTiers, type FatTiers } from "./geometry.js";

describe("fatTier — ordinal weight tiers", () => {
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

// `WEIGHTS` is indexed by the prop, so an off-table `tiers` used to read
// `undefined[idx]` and throw a TypeError out of the whole render.
describe("resolveTiers — off-table tier counts", () => {
  const OFF: unknown[] = [4, 0, 1, -5, Number.NaN, Number.POSITIVE_INFINITY, null, undefined, "5"];

  it("keeps the two documented tables", () => {
    expect(resolveTiers(3)).toBe(3);
    expect(resolveTiers(5)).toBe(5);
  });

  for (const t of OFF) {
    it(`${String(t)} → the default 5, no throw`, () => {
      expect(resolveTiers(t as FatTiers)).toBe(5);
      const r = fatTier(50, [0, 100], t as FatTiers);
      expect(r.tier).toBe(3);
      expect(Number.isFinite(r.weight)).toBe(true);
    });
  }

  it("digit mode survives an off-table tier count", () => {
    const r = fatDigitsGeometry({
      formatted: "1902",
      value: 1902,
      domain: [0, 2000],
      tiers: 4 as unknown as FatTiers,
      encode: "digit",
      fontSize: 14,
      pad: 2,
    });
    expect(r.glyphs!.map((g) => Number.isFinite(g.weight))).toEqual([true, true, true, true]);
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

  // Containment: `.mc-root` is overflow: visible, so the numeral's estimated
  // extent escaping the box is a spill onto the page, not a clip. The run is one
  // centred baseline, so the vertical check is the ~0.5em half-extent of a
  // central-baseline glyph either side of `y`.
  test.prop([
    fc.stringMatching(/^-?[\d,.]{1,24}$/),
    fc.integer({ min: 4, max: 96 }),
    fc.constantFrom("value" as const, "digit" as const),
  ])("the numeral's estimated extent never leaves the viewBox", (formatted, fontSize, encode) => {
    const r = fatDigitsGeometry({ ...base, formatted, fontSize, encode });
    expect(r.x + formatted.length * 0.62 * fontSize).toBeLessThanOrEqual(r.width);
    expect(r.y - fontSize * 0.5).toBeGreaterThanOrEqual(0);
    expect(r.y + fontSize * 0.5).toBeLessThanOrEqual(r.height);
  });
});
