import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { breathingDotGeometry, resolveSize, resolveThresholds } from "./geometry.js";

const g = (value: number | null, thresholds: readonly [number, number] = [0.5, 0.8]) =>
  breathingDotGeometry({ value, size: 16, thresholds, pad: 1 });

describe("breathingDotGeometry — ambient load", () => {
  it("bands split at the thresholds: < lower calm, [lower,upper) elevated, ≥ upper strained", () => {
    expect(g(0.3).band).toBe(0);
    expect(g(0.5).band).toBe(1); // at the lower edge → elevated
    expect(g(0.65).band).toBe(1);
    expect(g(0.8).band).toBe(2); // at the upper edge → strained
    expect(g(0.95).band).toBe(2);
  });

  it("ring radius grows with the level (the static level read)", () => {
    expect(g(0.2).ring.r).toBeLessThan(g(0.9).ring.r);
    expect(g(0).ring.r).toBeCloseTo(g(0).core.r, 1); // zero → ring at the core
  });

  it("null / NaN → unknown (no ring)", () => {
    expect(g(null).unknown).toBe(true);
    expect(g(NaN).unknown).toBe(true);
    expect(Number.isNaN(g(null).level)).toBe(true);
  });

  it("value is clamped to [0,1]", () => {
    expect(g(2).level).toBe(1);
    expect(g(-1).level).toBe(0);
  });

  test.prop([fc.double({ min: 0, max: 1, noNaN: true })])("ring stays inside the box", (v) => {
    const geo = g(v);
    expect(geo.ring.r).toBeLessThanOrEqual(geo.size / 2);
    expect(geo.ring.r).toBeGreaterThanOrEqual(geo.core.r - 0.01);
  });
});

// Hostile CONFIG: `thresholds` and `size` are host-computed, so a non-finite one
// is ordinary (`Number("")`, a CSS var read back, a collapsed measurement).
describe("breathingDotGeometry — hostile config", () => {
  it("non-finite band edges fall back to the default, not to 'strained'", () => {
    // NaN loses every comparison, so [NaN, NaN] used to paint AND announce the
    // negative band at any load.
    expect(resolveThresholds([NaN, NaN])).toEqual([0.5, 0.8]);
    expect(resolveThresholds([0.5, Infinity])).toEqual([0.5, 0.8]);
    expect(resolveThresholds(undefined)).toEqual([0.5, 0.8]);
    expect(g(0.6, [NaN, NaN]).band).toBe(1);
    expect(g(0.2, [NaN, NaN]).band).toBe(0);
  });

  it("a descending pair is normalised so 'elevated' stays reachable", () => {
    expect(resolveThresholds([0.8, 0.5])).toEqual([0.5, 0.8]);
    expect(g(0.6, [0.8, 0.5]).band).toBe(1);
  });

  it("finite edges pass through untouched", () => {
    expect(resolveThresholds([0.6, 0.85])).toEqual([0.6, 0.85]);
    expect(g(0.72, [0.6, 0.85]).band).toBe(1);
  });

  it("a non-finite size falls back to 16; every coord derives from the box", () => {
    expect(resolveSize(NaN)).toBe(16);
    expect(resolveSize(Infinity)).toBe(16);
    expect(resolveSize(24.4)).toBe(24);
    const geo = breathingDotGeometry({ value: 0.6, size: NaN, thresholds: [0.5, 0.8], pad: 1 });
    expect(geo.size).toBe(16);
    expect([geo.core.cx, geo.core.cy, geo.core.r, geo.ring.r].every(Number.isFinite)).toBe(true);
  });

  it("a 0 / negative size clamps the box AND the marks together", () => {
    // The mark used to be drawn from the raw prop while the box was clamped to
    // 1, so size={-20} put the dot at cx=-10 outside a 1x1 viewBox.
    for (const size of [0, -20]) {
      const geo = breathingDotGeometry({ value: 0.6, size, thresholds: [0.5, 0.8], pad: 1 });
      expect(geo.size).toBe(1);
      expect(geo.core.cx).toBeGreaterThanOrEqual(0);
      expect(geo.core.cx).toBeLessThanOrEqual(geo.size);
      // a negative radius drops the circle from the render entirely
      expect(geo.core.r).toBeGreaterThan(0);
      expect(geo.ring.r).toBeGreaterThan(0);
    }
  });
});
