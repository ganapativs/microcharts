import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { fillWordGeometry, resolveFontSize } from "./geometry.js";

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

  it("ALL-CAPS words use a wider extent so the numeral clears the glyphs", () => {
    const r = fillWordGeometry({
      value: 0.41,
      word: "SNOWPACK",
      fontSize: 26,
      pad: 2,
      mode: "fill",
      label: true,
    });
    // 0.72 em/ch for caps — numeral must clear the word body.
    expect(r.numeralX!).toBeGreaterThanOrEqual(2 + "SNOWPACK".length * 0.72 * 26);
  });

  // fontSize is the ONLY size input here, so an unresolved one took every
  // coordinate with it — and the summary still read normally.
  it("a non-finite or non-positive fontSize falls back to the default 12", () => {
    for (const bad of [NaN, Infinity, -Infinity, 0, -12, undefined]) {
      expect(resolveFontSize(bad)).toBe(12);
    }
    expect(resolveFontSize(26)).toBe(26);
    for (const bad of [NaN, Infinity, -Infinity, 0, -12]) {
      const r = fillWordGeometry({
        value: 0.5,
        word: "uploading",
        fontSize: bad,
        pad: 2,
        mode: "fill",
        label: true,
      });
      expect(r).toEqual(g(0.5, "uploading", "fill", true));
    }
  });

  // Hostile sentinels plus the whole plausible size range (a caption through a
  // poster). Past ~1e307 the box overflows the float itself, which `Chart`'s own
  // width/height clamp catches — that is not this function's job.
  test.prop([
    fc.double({ min: 0, max: 1, noNaN: true }),
    fc.oneof(
      fc.constantFrom(NaN, Infinity, -Infinity, 0, -12),
      fc.double({ min: 0.1, max: 1e6, noNaN: true }),
    ),
  ])("every coordinate stays finite whatever fontSize arrives", (value, fontSize) => {
    const r = fillWordGeometry({ value, word: "processing", fontSize, pad: 2, mode: "fill" });
    for (const n of [r.textLength, r.x, r.y, r.width, r.height, r.pct]) {
      expect(Number.isFinite(n)).toBe(true);
    }
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
