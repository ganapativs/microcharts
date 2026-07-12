import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { fillWordGeometry } from "./geometry.js";

const g = (value: number, word = "uploading", mode: "fill" | "drain" = "fill", label = false) =>
  fillWordGeometry({ value, word, fontSize: 12, pad: 2, mode, label });

describe("fillWordGeometry — the label is the bar", () => {
  it("fill clips the right (1−value) of the word", () => {
    expect(g(0.62).clip).toBe("inset(0 38% 0 0)");
    expect(g(0.62).pct).toBe(62);
  });

  it("drain clips the left value away (ink empties from the left)", () => {
    expect(g(0.62, "session", "drain").clip).toBe("inset(0 0 0 62%)");
  });

  it("value clamps to [0,1]", () => {
    expect(g(1.5).clip).toBe("inset(0 0% 0 0)");
    expect(g(-0.5).clip).toBe("inset(0 100% 0 0)");
  });

  it("empty word → no clip, still a valid width", () => {
    const r = g(0.5, "");
    expect(r.clip).toBeNull();
    expect(r.width).toBeGreaterThanOrEqual(1);
  });

  it("label reserves a gutter and places the numeral after the word", () => {
    const plain = g(0.5, "quota");
    const labelled = g(0.5, "quota", "fill", true);
    expect(labelled.numeralX).not.toBeNull();
    expect(labelled.width).toBeGreaterThan(plain.width);
    // the numeral hugs the word's REAL rendered extent (~0.56 em/char), which sits
    // inside the 0.62 containment over-estimate — so it clears the glyphs without
    // the dead gap the over-estimate used to leave.
    const realExtent = "quota".length * 0.56 * 12;
    expect(labelled.numeralX!).toBeGreaterThan(labelled.x + realExtent);
    expect(labelled.numeralX!).toBeLessThan(labelled.width);
  });

  test.prop([fc.double({ min: 0, max: 1, noNaN: true }), fc.boolean()])(
    "the word extent + numeral stay within width",
    (value, label) => {
      const r = g(value, "processing", "fill", label);
      expect(r.x + r.textLength).toBeLessThanOrEqual(r.width);
      if (r.numeralX !== null) expect(r.numeralX).toBeLessThanOrEqual(r.width);
    },
  );
});
