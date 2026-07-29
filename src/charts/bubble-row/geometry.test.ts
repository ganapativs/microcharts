import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { bubbleLayout, bubbleRowGeometry, isBubbleValue } from "./geometry.js";

const g = (values: (number | null)[], align: "center" | "baseline" = "center") =>
  bubbleRowGeometry({ values, height: 30, gap: 2, align, pad: 1, labelBand: 8 });

describe("bubbleRowGeometry — area-true bubbles", () => {
  it("radius is √value (area-true, never linear)", () => {
    const geo = g([400, 100]);
    expect(geo.bubbles[0]!.r / geo.bubbles[1]!.r).toBeCloseTo(2, 1); // √(400/100)=2
  });

  it("the max value fills rMax", () => {
    const geo = g([50, 100, 25]);
    const rMax = Math.max(...geo.bubbles.map((b) => b.r));
    expect(geo.bubbles[1]!.r).toBe(rMax);
  });

  it("bubbles touch (spacing = r + gap + r)", () => {
    const geo = g([100, 100]);
    const dx = geo.bubbles[1]!.cx - geo.bubbles[0]!.cx;
    expect(dx).toBeCloseTo(geo.bubbles[0]!.r + 2 + geo.bubbles[1]!.r, 1);
  });

  it("zero → a small presence ring; null → same, value null", () => {
    const geo = g([0, null, 10]);
    expect(geo.bubbles[0]!.r).toBe(0.5);
    expect(geo.bubbles[1]!.r).toBe(0.5);
    expect(geo.bubbles[1]!.value).toBeNull();
  });

  it("a negative is not encodable — presence ring, value null, out of the max", () => {
    const geo = g([-5, 10]);
    expect(geo.bubbles[0]!.r).toBe(0.5);
    expect(geo.bubbles[0]!.value).toBeNull();
    expect(geo.bubbles[1]!.r).toBe(9); // 10 alone sets rMax = bandH / 2
    expect(isBubbleValue(-5)).toBe(false);
    expect(isBubbleValue(Number.NaN)).toBe(false);
    expect(isBubbleValue(0)).toBe(true);
  });

  it("baseline align bottoms the bubbles on one line", () => {
    const geo = g([100, 25], "baseline");
    const bottoms = geo.bubbles.map((b) => b.cy + b.r);
    expect(bottoms[0]!).toBeCloseTo(bottoms[1]!, 1);
  });

  test.prop([fc.array(fc.integer({ min: 0, max: 1000 }), { minLength: 1, maxLength: 8 })])(
    "bubbles stay inside the row",
    (values) => {
      const geo = bubbleRowGeometry({
        values,
        height: 30,
        gap: 2,
        align: "center",
        pad: 1,
        labelBand: 8,
      });
      for (const b of geo.bubbles) {
        expect(b.cx - b.r).toBeGreaterThanOrEqual(-0.01);
        expect(b.cx + b.r).toBeLessThanOrEqual(geo.width + 0.01);
        expect(b.cy - b.r).toBeGreaterThanOrEqual(-0.01);
      }
    },
  );
});

describe("bubbleLayout — the scalars both entries share", () => {
  it("defaults: 30 tall, gap 2, numerals at the library norm", () => {
    expect(bubbleLayout({ label: "value" })).toEqual({
      height: 30,
      gap: 2,
      fontSize: 10,
      band: 12,
      labelY: 25.8,
      charW: 0.72,
    });
  });

  it("refuses a non-finite or negative scalar rather than passing NaN on", () => {
    const dflt = bubbleLayout({ label: "value" });
    for (const bad of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, -8]) {
      expect(bubbleLayout({ height: bad, label: "value" })).toEqual(dflt);
      expect(bubbleLayout({ gap: bad, label: "value" })).toEqual(dflt);
      expect(bubbleLayout({ fontSize: bad, label: "value" })).toEqual(dflt);
    }
  });

  it("caller text reserves at the prose rate, our own figures at the digit rate", () => {
    expect(bubbleLayout({ label: "both" }).charW).toBe(0.95);
    expect(bubbleLayout({ label: "value" }).charW).toBe(0.72);
  });

  it("drops the numerals — band and all — once the box can't seat them", () => {
    expect(bubbleLayout({ height: 8, label: "value" })).toMatchObject({ band: 0, charW: 0 });
    expect(bubbleLayout({ height: 30, label: "none" })).toMatchObject({ band: 0, charW: 0 });
    expect(bubbleLayout({ height: 12, label: "value" }).band).toBe(9);
  });
});
