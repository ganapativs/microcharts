import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { moonGeometry, resolveSize } from "./geometry.js";

const g = (value: number, mode: "progress" | "cycle" = "progress") =>
  moonGeometry({ value, mode, size: 16, pad: 0.5 });

describe("moonGeometry — area-true illumination", () => {
  it("progress: illumination equals the value (monotonic)", () => {
    expect(g(0).litFraction).toBe(0);
    expect(g(0.5).litFraction).toBe(0.5);
    expect(g(1).litFraction).toBe(1);
    expect(g(0.68).litFraction).toBe(0.68);
  });

  it("dark is an empty path; full is a closed disc path", () => {
    expect(g(0).litPath).toBe("");
    expect(g(1).litPath).not.toBe("");
    expect(g(0.5).litPath).toContain("A"); // an arc path
  });

  it("cycle: 0 new → 0.5 full → 1 new, waxing then waning", () => {
    expect(g(0, "cycle").litFraction).toBe(0);
    expect(g(0.5, "cycle").litFraction).toBe(1);
    expect(g(1, "cycle").litFraction).toBe(0);
    // symmetric illumination either side of full
    expect(g(0.25, "cycle").litFraction).toBe(g(0.75, "cycle").litFraction);
  });

  it("value clamps to [0,1]", () => {
    expect(g(1.5).litFraction).toBe(1);
    expect(g(-0.5).litFraction).toBe(0);
  });

  it("disc geometry", () => {
    const d = g(0.5).disc;
    expect(d.cx).toBe(8);
    expect(d.cy).toBe(8);
    expect(d.r).toBe(7.5);
  });

  // `size` arrives from hosts, not just literals — see resolveSize's note.
  it("size resolves to a drawable box", () => {
    for (const bad of [NaN, Infinity, -Infinity]) expect(resolveSize(bad)).toBe(16);
    expect(resolveSize(0)).toBe(1);
    expect(resolveSize(-20)).toBe(1);
    expect(resolveSize(0.4)).toBe(1);
    expect(resolveSize(24.4)).toBe(24);
  });

  it("every coord derives from the resolved box, never the prop", () => {
    const bad = moonGeometry({ value: 0.68, mode: "progress", size: NaN, pad: 0.5 });
    expect(bad.size).toBe(16);
    expect(bad.disc).toEqual({ cx: 8, cy: 8, r: 7.5 });
    expect(bad.litPath).not.toMatch(/NaN|Infinity/);
  });

  // A negative `r` is an SVG error that drops the circle; the survivors then sat
  // outside the box, which `.mc-root`'s `overflow: visible` paints on the page.
  it("a sub-unit box gives a non-negative radius inside the viewBox", () => {
    for (const size of [0, -20, 0.4, 1]) {
      const geo = moonGeometry({ value: 0.68, mode: "progress", size, pad: 0.5 });
      expect(geo.size).toBe(1);
      expect(geo.disc.r).toBeGreaterThanOrEqual(0);
      expect(geo.disc.cx - geo.disc.r).toBeGreaterThanOrEqual(0);
      expect(geo.disc.cx + geo.disc.r).toBeLessThanOrEqual(geo.size);
    }
  });

  test.prop([fc.double({ min: 0, max: 1, noNaN: true })])(
    "gibbous lights more than crescent at the same |0.5 offset|",
    (d) => {
      const off = d * 0.4; // 0..0.4
      const crescent = g(0.5 - off).litFraction;
      const gibbous = g(0.5 + off).litFraction;
      // crescent < half < gibbous (progress mode)
      expect(crescent).toBeLessThanOrEqual(0.5);
      expect(gibbous).toBeGreaterThanOrEqual(0.5);
    },
  );
});
