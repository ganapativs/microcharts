import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { ringGeometry, ringLabelFont } from "./geometry.js";

describe("ringGeometry", () => {
  it("fraction 0 → track only (no zero-length arc artifact)", () => {
    const geo = ringGeometry({ size: 24, fraction: 0, weight: 3, sweep: false });
    expect(geo.track).not.toBe("");
    expect(geo.arc).toBe("");
  });

  it("fraction 1 → full annulus (SVG can't draw one 360° arc)", () => {
    const geo = ringGeometry({ size: 24, fraction: 1, weight: 3, sweep: false });
    expect(geo.arc).not.toBe("");
    // full sweep emits two arc segments
    expect((geo.arc.match(/A/g) ?? []).length).toBeGreaterThanOrEqual(2);
  });

  it("overflow clamps the ring (label carries the truth in the component)", () => {
    const over = ringGeometry({ size: 24, fraction: 1.4, weight: 3, sweep: false });
    const full = ringGeometry({ size: 24, fraction: 1, weight: 3, sweep: false });
    expect(over.arc).toBe(full.arc);
  });

  it("sweep renders the REMAINING wedge; full → empty", () => {
    const half = ringGeometry({ size: 24, fraction: 0.5, weight: 3, sweep: true });
    expect(half.arc).not.toBe("");
    const done = ringGeometry({ size: 24, fraction: 1, weight: 3, sweep: true });
    expect(done.arc).toBe("");
  });

  it("3-digit percent stays inside the hole (≥1 unit air from the ring)", () => {
    for (const size of [24, 32, 40, 48]) {
      const weight = 3;
      const rInner = size / 2 - 0.5 - weight;
      const geo = ringGeometry({ size, fraction: 1, weight, sweep: false, labelChars: 4 });
      expect(geo.fontSize).toBeGreaterThan(0);
      const halfW = (4 * geo.fontSize * 0.62) / 2;
      expect(halfW).toBeLessThanOrEqual(rInner - 1);
      expect(geo.fontSize / 2).toBeLessThanOrEqual(rInner - 1);
    }
  });

  it("tiny ring drops the label rather than touching the track", () => {
    const geo = ringGeometry({ size: 14, fraction: 0.5, weight: 3, sweep: false, labelChars: 4 });
    expect(geo.fontSize).toBe(0);
  });

  test.prop([
    fc.double({ min: 0, max: 1, noNaN: true }),
    fc.integer({ min: 1, max: 10 }),
    fc.boolean(),
  ])("containment: all path coords inside the box, 2-dp", (fraction, weight, sweep) => {
    const geo = ringGeometry({ size: 24, fraction, weight, sweep });
    for (const m of `${geo.track} ${geo.arc}`.matchAll(/-?\d+(?:\.\d+)?/g)) {
      const v = Number(m[0]);
      expect(v).toBeGreaterThanOrEqual(-0.01);
      expect(v).toBeLessThanOrEqual(24.01);
    }
  });
});

describe("ringLabelFont", () => {
  it("sizes for ≥4 glyphs so 9% and 100% share one fit budget", () => {
    const a = ringLabelFont(16, 2);
    const b = ringLabelFont(16, 4);
    expect(a).toBe(b);
    expect(a).toBeGreaterThan(0);
  });
});
