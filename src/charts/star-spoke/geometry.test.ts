import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { resolveDomain, starBox, starSpokeGeometry, UNIT_DOMAIN } from "./geometry.js";

describe("starSpokeGeometry", () => {
  it("first spoke is at 12 o'clock, second is clockwise", () => {
    const geo = starSpokeGeometry({ values: [1, 1, 1, 1], domain: [0, 1], width: 32, height: 32 });
    expect(geo.spokes[0]!.tx).toBeCloseTo(16, 1); // straight up: x = center
    expect(geo.spokes[0]!.ty).toBeLessThan(16); // above center
    expect(geo.spokes[1]!.tx).toBeGreaterThan(16); // clockwise → right
  });

  it("length is proportional to value on the shared domain", () => {
    const geo = starSpokeGeometry({ values: [1, 0.5], domain: [0, 1], width: 32, height: 32 });
    const len0 = Math.hypot(geo.spokes[0]!.tx - 16, geo.spokes[0]!.ty - 16);
    const len1 = Math.hypot(geo.spokes[1]!.tx - 16, geo.spokes[1]!.ty - 16);
    expect(len0).toBeGreaterThan(len1 * 1.8);
  });

  it("emits a value spoke path and a full-length guide path (no polygon)", () => {
    const geo = starSpokeGeometry({
      values: [0.8, 0.4, 0.6],
      domain: [0, 1],
      width: 32,
      height: 32,
    });
    expect(geo.spokePath).toContain("M");
    expect(geo.guidePath).toContain("M");
    // no closed contour — spoke path never uses Z
    expect(geo.spokePath).not.toContain("Z");
  });

  test.prop([fc.array(fc.double({ min: 0, max: 1, noNaN: true }), { minLength: 3, maxLength: 8 })])(
    "tips stay inside the glyph box",
    (values) => {
      const geo = starSpokeGeometry({ values, domain: [0, 1], width: 32, height: 32 });
      for (const s of geo.spokes) {
        expect(Math.hypot(s.tx - 16, s.ty - 16)).toBeLessThanOrEqual(16.01);
      }
    },
  );
});

// Hostile CONFIG, not hostile data: `domain` off a reduce over a series holding
// a NaN, `size` off an empty number field. Each one used to send every spoke
// coordinate to NaN — an invalid path the browser drops, so the star painted
// EMPTY while the summary still named a highest and a lowest metric.
const UNUSABLE: readonly (readonly [number, number])[] = [
  [NaN, NaN],
  [NaN, 1],
  [0, NaN],
  [-Infinity, Infinity],
  [-1e308, 1e308], // finite ends, span overflows
];

describe("starSpokeGeometry hostile config", () => {
  it("repairs a domain the scale cannot use, and keeps a usable one by identity", () => {
    for (const bad of UNUSABLE) expect(resolveDomain(bad)).toBe(UNIT_DOMAIN);
    expect(resolveDomain(undefined)).toBe(UNIT_DOMAIN);
    // identity, not just equality: the interactive entry memoises on it
    const good: readonly [number, number] = [0, 100];
    expect(resolveDomain(good)).toBe(good);
    // reversed is a typo, not an inverted scale — swapped, not dropped
    expect(resolveDomain([1, 0])).toEqual([0, 1]);
    expect(resolveDomain([100, 20])).toEqual([20, 100]);
  });

  it("an unusable or reversed domain scales like the unit domain, never as NaN", () => {
    const values = [0.9, 0.6, 0.3];
    const box = { width: 32, height: 32 } as const;
    const unit = starSpokeGeometry({ values, domain: [0, 1], ...box }).spokePath;
    for (const domain of [...UNUSABLE, [1, 0] as const]) {
      expect(starSpokeGeometry({ values, domain, ...box }).spokePath).toBe(unit);
    }
  });

  it("an unusable box falls back to the default, never a NaN or negative radius", () => {
    expect(starBox(NaN)).toBe(80);
    expect(starBox(Infinity)).toBe(80);
    expect(starBox(0)).toBe(80);
    expect(starBox(-20)).toBe(80);
    expect(starBox(64.4)).toBe(64);
    const geo = starSpokeGeometry({
      values: [0.9, 0.6, 0.3],
      domain: [0, 1],
      width: NaN,
      height: NaN,
    });
    expect(geo.spokePath).not.toMatch(/NaN|Infinity/);
    expect(geo.guidePath).not.toMatch(/NaN|Infinity/);
  });

  // A pad wider than the half-box inverted every radius: spokes ran backwards
  // out of the box, and `.mc-root` is overflow: visible, so that paints.
  it("a pad wider than the half-box collapses the star, it never inverts it", () => {
    const geo = starSpokeGeometry({
      values: [1, 1, 1],
      domain: [0, 1],
      width: 4,
      height: 4,
      pad: 6,
    });
    for (const s of geo.spokes) {
      expect(s.tx).toBe(2);
      expect(s.ty).toBe(2);
      expect(s.rx).toBe(2);
      expect(s.ry).toBe(2);
    }
  });
});
