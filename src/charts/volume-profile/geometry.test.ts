import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { binMass, profileLayout, volumeProfileGeometry } from "./geometry.js";

const PROFILE = [
  { level: 138, weight: 8 },
  { level: 140, weight: 14 },
  { level: 142, weight: 25 },
  { level: 144, weight: 13 },
  { level: 146, weight: 7 },
];

describe("volumeProfileGeometry", () => {
  it("finds the POC (modal level) and the value area", () => {
    const geo = volumeProfileGeometry({
      data: PROFILE,
      bins: 5,
      valueArea: 0.7,
      align: "left",
      width: 48,
      height: 32,
      gutter: 0,
    });
    expect(geo.bars.length).toBe(5);
    expect(geo.poc!.level).toBe(142);
    expect(geo.bars.find((b) => b.poc)!.level).toBe(142);
    expect(geo.vaLo).toBe(140.4);
    expect(geo.vaHi).toBe(143.6);
  });

  it("raw levels are counted into bins", () => {
    const rows = binMass([140, 142, 142, 142, 144], 3);
    expect(rows.reduce((s, r) => s + r.mass, 0)).toBe(5);
  });

  it("a uniform distribution reads as evenly spread", () => {
    const flat = Array.from({ length: 6 }, (_, i) => ({ level: 100 + i * 2, weight: 10 }));
    const geo = volumeProfileGeometry({
      data: flat,
      bins: 6,
      valueArea: 0.7,
      align: "left",
      width: 48,
      height: 32,
      gutter: 0,
    });
    expect(geo.even).toBe(true);
  });

  it("profileLayout reserves the POC-label gutter", () => {
    const args = {
      data: PROFILE,
      bins: 5,
      valueArea: 0.7,
      width: 48,
      height: 32,
      fontSize: 4,
      fmt: (n: number) => `${n}`,
    } as const;
    const withLabel = profileLayout({ ...args, align: "left", label: "poc" });
    const without = profileLayout({ ...args, align: "left", label: "none" });
    expect(withLabel.pocText).toBe("142");
    expect(without.pocText).toBeUndefined();
    // the gutter narrows every bar, so a caller that skips it overdraws
    expect(withLabel.bars[0]!.width).toBeLessThan(without.bars[0]!.width);
    // right-anchored bars start further right for the same reason
    const right = profileLayout({ ...args, align: "right", label: "poc" });
    const rightBare = profileLayout({ ...args, align: "right", label: "none" });
    expect(right.bars[0]!.x).toBeGreaterThan(rightBare.bars[0]!.x);
  });

  test.prop([
    fc.array(fc.double({ min: 100, max: 200, noNaN: true }), { minLength: 1, maxLength: 300 }),
  ])("bars stay inside the plot", (levels) => {
    const geo = volumeProfileGeometry({
      data: levels,
      bins: 12,
      valueArea: 0.7,
      align: "left",
      width: 48,
      height: 32,
      gutter: 8,
    });
    for (const b of geo.bars) {
      expect(b.x).toBeGreaterThanOrEqual(0);
      expect(b.x + b.width).toBeLessThanOrEqual(48.01);
      expect(b.y + b.height).toBeLessThanOrEqual(32.01);
    }
  });
});
