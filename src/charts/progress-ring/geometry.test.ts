import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { RING_SIZE, ringGeometry, ringLabelFont, ringLabelSize, ringSize } from "./geometry.js";

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

describe("hostile scalars", () => {
  it("size: only positive-finite survives", () => {
    for (const bad of [Number.NaN, Infinity, -Infinity, 0, -5, undefined]) {
      expect(ringSize(bad)).toBe(RING_SIZE);
    }
    expect(ringSize(40)).toBe(40);
  });

  it("weight: non-finite takes the default rather than NaN radii", () => {
    const good = ringGeometry({ size: 24, fraction: 0.5, weight: 3, sweep: false });
    for (const bad of [Number.NaN, undefined]) {
      expect(ringGeometry({ size: 24, fraction: 0.5, weight: bad, sweep: false })).toEqual(good);
    }
  });

  it("weight never clamps below 0 — a negative stroke-width drops the arc", () => {
    for (const size of [1, 2, 3, 24]) {
      const geo = ringGeometry({ size, fraction: 0.5, weight: 3, sweep: false });
      expect(geo.weight).toBeGreaterThanOrEqual(0);
    }
  });

  it("every geometry field stays finite under hostile size/weight", () => {
    for (const bad of [Number.NaN, Infinity, -Infinity, 0, -5]) {
      for (const geo of [
        ringGeometry({ size: bad, fraction: 0.5, weight: 3, sweep: false, labelChars: 4 }),
        ringGeometry({ size: 24, fraction: 0.5, weight: bad, sweep: false, labelChars: 4 }),
      ]) {
        for (const n of [geo.weight, geo.labelX, geo.labelY, geo.fontSize, geo.y0, geo.y1]) {
          expect(Number.isFinite(n)).toBe(true);
        }
        expect(`${geo.track} ${geo.arc}`).not.toMatch(/NaN|Infinity/);
      }
    }
  });
});

describe("ringLabelSize", () => {
  it("agrees with the size the ring actually renders", () => {
    // The interactive entry gates its chip on this, so the two must not drift.
    for (const size of [16, 20, 24, 32, 48]) {
      expect(ringLabelSize(size, 3, 4)).toBe(
        ringGeometry({ size, fraction: 1, weight: 3, sweep: false, labelChars: 4 }).fontSize,
      );
    }
  });

  it("0 when the hole cannot seat the figure", () => {
    expect(ringLabelSize(16, 3, 4)).toBe(0);
    expect(ringLabelSize(32, 3, 4)).toBeGreaterThan(0);
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
