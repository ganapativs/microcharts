import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { trendArrowGeometry, type TrendGlyph } from "./geometry.js";

const GLYPHS: TrendGlyph[] = ["arrow", "triangle", "chevron"];

function coords(d: string): { xs: number[]; ys: number[] } {
  const nums = [...d.matchAll(/-?\d+(?:\.\d+)?/g)].map((m) => Number(m[0]));
  return {
    xs: nums.filter((_, i) => i % 2 === 0),
    ys: nums.filter((_, i) => i % 2 === 1),
  };
}

describe("trendArrowGeometry", () => {
  it("up and down are distinct for every glyph family", () => {
    for (const glyph of GLYPHS) {
      const up = trendArrowGeometry({ width: 16, height: 16, direction: "up", glyph });
      const down = trendArrowGeometry({ width: 16, height: 16, direction: "down", glyph });
      expect(up.d).not.toBe(down.d);
    }
  });

  it("flat is one shared shape across glyph families", () => {
    const [a, b, c] = GLYPHS.map(
      (glyph) => trendArrowGeometry({ width: 16, height: 16, direction: "flat", glyph }).d,
    );
    expect(a).toBe(b);
    expect(b).toBe(c);
  });

  it("down is the exact vertical mirror of up (honest symmetry)", () => {
    for (const glyph of GLYPHS) {
      const up = coords(trendArrowGeometry({ width: 16, height: 16, direction: "up", glyph }).d);
      const down = coords(
        trendArrowGeometry({ width: 16, height: 16, direction: "down", glyph }).d,
      );
      expect(down.xs).toEqual(up.xs);
      expect(down.ys).toEqual(up.ys.map((y) => Math.round((16 - y) * 100) / 100));
    }
  });

  test.prop([
    fc.integer({ min: 8, max: 64 }),
    fc.integer({ min: 8, max: 64 }),
    fc.constantFrom<"up" | "down" | "flat">("up", "down", "flat"),
    fc.constantFrom(...GLYPHS),
  ])("all coords stay inside the box, 2-dp (containment)", (width, height, direction, glyph) => {
    const geo = trendArrowGeometry({ width, height, direction, glyph });
    const { xs, ys } = coords(geo.d);
    for (const x of xs) {
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThanOrEqual(width);
      expect(x).toBe(Math.round(x * 100) / 100);
    }
    for (const y of ys) {
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThanOrEqual(height);
      expect(y).toBe(Math.round(y * 100) / 100);
    }
    // central baseline → the em box is labelY ± 0.5·fontSize
    expect(geo.labelY + geo.fontSize * 0.5).toBeLessThanOrEqual(height + 1);
    expect(geo.labelY - geo.fontSize * 0.5).toBeGreaterThanOrEqual(-1);
  });
});
