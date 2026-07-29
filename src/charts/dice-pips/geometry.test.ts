import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { dicePipsGeometry, resolveSize } from "./geometry.js";

const g = (value: number) => dicePipsGeometry({ value, size: 16 });

describe("dicePipsGeometry — canonical dice faces", () => {
  it("draws exactly `value` pips for faces 1–6", () => {
    for (let v = 1; v <= 6; v++) expect(g(v).pips.length).toBe(v);
  });

  it("1 is the centre pip; 6 is two columns of three", () => {
    const one = g(1).pips[0]!;
    expect(one.cx).toBeCloseTo(8, 1);
    expect(one.cy).toBeCloseTo(8, 1);
    const six = g(6).pips;
    expect(six.length).toBe(6);
    // two distinct x columns, three distinct y rows
    expect(new Set(six.map((p) => p.cx)).size).toBe(2);
    expect(new Set(six.map((p) => p.cy)).size).toBe(3);
  });

  it("0 is an empty face (zero, not missing)", () => {
    const r = g(0);
    expect(r.pips.length).toBe(0);
    expect(r.numeral).toBeNull();
    expect(r.value).toBe(0);
  });

  it("> 6 → centered numeral, no invented pattern", () => {
    const r = g(9);
    expect(r.pips.length).toBe(0);
    expect(r.numeral).toBe("9");
    expect(r.value).toBe(9);
  });

  it("negatives / NaN are invalid (value null)", () => {
    expect(g(-2).value).toBeNull();
    expect(g(NaN).value).toBeNull();
    expect(g(-2).pips.length).toBe(0);
  });

  it("non-integers round", () => {
    expect(g(3.4).pips.length).toBe(3);
    expect(g(3.6).pips.length).toBe(4);
  });

  // A host computes `size` as often as it types one — a CSS var read back, a
  // collapsed flex box, an empty numeric input. Non-finite used to reach the
  // viewBox verbatim while the accessible name read normally.
  it("a non-physical `size` falls back to the default box, never NaN coords", () => {
    for (const bad of [NaN, Infinity, -Infinity]) {
      expect(resolveSize(bad)).toBe(16);
      expect(dicePipsGeometry({ value: 4, size: bad }).size).toBe(16);
    }
    expect(resolveSize(0)).toBe(1);
    expect(resolveSize(-20)).toBe(1);
    const tiny = dicePipsGeometry({ value: 4, size: -20 });
    expect(tiny.size).toBe(1);
    expect(tiny.face.width).toBe(0);
    for (const p of tiny.pips) expect(p.cx - p.r).toBeGreaterThanOrEqual(0);
  });

  test.prop([fc.integer({ min: 0, max: 6 })])("all pips + face stay inside the box", (value) => {
    const r = dicePipsGeometry({ value, size: 16 });
    for (const p of r.pips) {
      expect(p.cx - p.r).toBeGreaterThanOrEqual(0);
      expect(p.cx + p.r).toBeLessThanOrEqual(16);
      expect(p.cy - p.r).toBeGreaterThanOrEqual(0);
      expect(p.cy + p.r).toBeLessThanOrEqual(16);
    }
    expect(r.face.x + r.face.width).toBeLessThanOrEqual(16);
  });
});
