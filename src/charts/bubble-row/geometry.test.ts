import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { bubbleRowGeometry } from "./geometry.js";

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
