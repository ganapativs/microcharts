import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { progressGeometry } from "./geometry.js";

describe("progressGeometry", () => {
  it("fill is fraction × track width, zero-anchored", () => {
    const geo = progressGeometry({ width: 48, height: 8, fraction: 0.5, gutterCh: 0, fontSize: 6 });
    expect(geo.fill.x).toBe(0);
    expect(geo.fill.w).toBe(geo.track.w / 2);
  });

  it("label gutter widens the viewBox — the track NEVER shrinks (comparability)", () => {
    const geo = progressGeometry({ width: 48, height: 8, fraction: 1, gutterCh: 4, fontSize: 6 });
    const bare = progressGeometry({ width: 48, height: 8, fraction: 1, gutterCh: 0, fontSize: 6 });
    expect(geo.track.w).toBe(48);
    expect(geo.track.w).toBe(bare.track.w); // same scale with or without a label
    expect(geo.totalWidth).toBe(48 + Math.ceil(4 * 6 * 0.62) + 5);
    expect(geo.labelX - 4 * 6 * 0.62).toBeGreaterThanOrEqual(geo.track.w); // text clears the bar
    expect(geo.labelX).toBeLessThanOrEqual(geo.totalWidth);
  });

  it("segments: whole slots fill fully, the remainder partially", () => {
    const geo = progressGeometry({
      width: 48,
      height: 8,
      fraction: 0.5, // 2.5 of 5 slots
      segments: 5,
      gutterCh: 0,
      fontSize: 6,
    });
    expect(geo.segments!.map((s) => s.fill)).toEqual([1, 1, 0.5, 0, 0]);
  });

  test.prop([
    fc.double({ min: 0, max: 1, noNaN: true }),
    fc.option(fc.integer({ min: 2, max: 12 }), { nil: undefined }),
    fc.integer({ min: 0, max: 6 }),
  ])("everything stays inside the box, 2-dp", (fraction, segments, gutterCh) => {
    const geo = progressGeometry({
      width: 48,
      height: 8,
      fraction,
      segments,
      gutterCh,
      fontSize: 6,
    });
    expect(geo.fill.w).toBeLessThanOrEqual(geo.track.w + 0.01);
    expect(geo.track.y + geo.track.h).toBeLessThanOrEqual(8);
    expect(geo.track.w).toBeLessThanOrEqual(geo.totalWidth);
    for (const s of geo.segments ?? []) {
      expect(s.x + s.w).toBeLessThanOrEqual(geo.track.w + 0.01);
      expect(s.fill).toBeGreaterThanOrEqual(0);
      expect(s.fill).toBeLessThanOrEqual(1);
    }
    expect(geo.labelY).toBeLessThanOrEqual(8);
  });
});
