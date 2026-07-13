import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { starSpokeGeometry } from "./geometry.js";

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
