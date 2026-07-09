import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { tallyGeometry } from "./geometry.js";

const base = { max: 25, height: 16, pad: 2, fontSize: 9 } as const;
const g = (
  value: number,
  over: "numeral" | "clamp" = "numeral",
  pen: "ruled" | "drawn" = "ruled",
) => tallyGeometry({ ...base, value, overflow: over, pen });
const strokes = (d: string) => (d.match(/M/g) ?? []).length;

describe("tallyGeometry (plan/24 #1) — count the way a human counts", () => {
  it("one stroke per count: 4 verticals + a strike per cluster of five", () => {
    // 23 = four struck clusters (20) + three remainder verticals = 23 strokes
    const r = g(23);
    expect(r.drawn).toBe(23);
    expect(strokes(r.d)).toBe(23);
    expect(r.overflow).toBe(0);
    expect(r.numeralX).toBeNull();
  });

  it("value > max → marks cap at max, numeral carries the rest", () => {
    const r = g(27);
    expect(r.drawn).toBe(25);
    expect(r.overflow).toBe(2);
    expect(strokes(r.d)).toBe(25);
    expect(r.numeralX).not.toBeNull();
  });

  it("overflow='clamp' stops drawing without a numeral (summary keeps truth)", () => {
    const r = g(30, "clamp");
    expect(r.drawn).toBe(25);
    expect(r.overflow).toBe(5); // reported for the summary, not drawn
    expect(r.numeralX).toBeNull();
  });

  it("value 0 → no marks, still a valid (≥1) width", () => {
    const r = g(0);
    expect(r.d).toBe("");
    expect(r.drawn).toBe(0);
    expect(r.width).toBeGreaterThanOrEqual(1);
  });

  it("negatives clamp to 0; non-integers floor", () => {
    expect(g(-5).drawn).toBe(0);
    expect(g(3.9).drawn).toBe(3);
    expect(strokes(g(3.9).d)).toBe(3);
  });

  it("the drawn pen is deterministic (seed from count)", () => {
    expect(g(17, "numeral", "drawn").d).toBe(g(17, "numeral", "drawn").d);
    // and differs from the ruled rendering (jittered coords)
    expect(g(17, "numeral", "drawn").d).not.toBe(g(17).d);
  });

  test.prop([fc.integer({ min: 0, max: 40 }), fc.constantFrom("ruled", "drawn" as const)])(
    "every coord stays within the viewBox",
    (value, pen) => {
      const r = tallyGeometry({
        ...base,
        value,
        overflow: "numeral",
        pen: pen as "ruled" | "drawn",
      });
      const nums = (r.d.match(/-?\d+\.?\d*/g) ?? []).map(Number);
      for (let i = 0; i < nums.length; i += 2) {
        const x = nums[i]!;
        const y = nums[i + 1]!;
        expect(x).toBeGreaterThanOrEqual(0);
        expect(x).toBeLessThanOrEqual(r.width);
        expect(y).toBeGreaterThanOrEqual(0);
        expect(y).toBeLessThanOrEqual(base.height);
      }
    },
  );
});
