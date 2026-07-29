import { describe, it, expect } from "vitest";
import { test, fc } from "@fast-check/vitest";
import { bulletGeometry } from "./geometry.js";

const g = (o: Partial<Parameters<typeof bulletGeometry>[0]> & { value: number }) =>
  bulletGeometry({ width: 80, height: 16, ...o });

describe("bulletGeometry", () => {
  it("measure bar spans 0 → value", () => {
    const b = g({ value: 50, domain: [0, 100] });
    expect(b.measure.x).toBe(1);
    expect(b.measure.width).toBeCloseTo(78 * 0.5, 0);
  });

  it("value clamps to the track when it exceeds max", () => {
    const b = g({ value: 200, domain: [0, 100] });
    expect(b.measure.x + b.measure.width).toBeLessThanOrEqual(79 + 1e-6);
  });

  it("target places a tick inside the track", () => {
    const b = g({ value: 40, target: 80, domain: [0, 100] });
    expect(b.tick).not.toBeNull();
    expect(b.tick!.x).toBeGreaterThan(b.measure.x + b.measure.width);
    expect(b.tick!.x).toBeLessThanOrEqual(79);
  });

  it("no target → no tick", () => {
    expect(g({ value: 40, domain: [0, 100] }).tick).toBeNull();
  });

  it("bands split the track into ascending regions", () => {
    const b = g({ value: 60, bands: [50, 80], domain: [0, 100] });
    expect(b.regions).toHaveLength(3);
    expect(b.regions.map((r) => r.step)).toEqual([0, 1, 2]);
    // contiguous, covering the track
    for (let i = 1; i < b.regions.length; i++) {
      expect(b.regions[i]!.x).toBeCloseTo(b.regions[i - 1]!.x + b.regions[i - 1]!.width, 1);
    }
  });

  it("out-of-range / unsorted thresholds are cleaned", () => {
    const b = g({ value: 60, bands: [80, 50, 999, -5], domain: [0, 100] });
    expect(b.regions).toHaveLength(3); // 50 and 80 kept, sorted; 999/-5 dropped
  });

  it("auto max fits value/target/bands", () => {
    const b = g({ value: 40, target: 90, bands: [120] });
    expect(b.max).toBeGreaterThanOrEqual(120);
  });
});

// Hostile CONFIG — `bands`/`domain`/`height` are props a host computes, not
// values typed by hand. Each case below crashed, inverted the reading, or
// emitted an out-of-box coordinate.
describe("bulletGeometry (hostile config)", () => {
  it("a bands array past the spread limit renders bounded regions instead of throwing", () => {
    // `Math.max(1, ...bands)` threw RangeError here; the regions are DOM nodes,
    // so their count is capped too.
    const bands = Array.from({ length: 200_000 }, (_, i) => i / 2000);
    const b = g({ value: 50, target: 80, bands });
    expect(b.max).toBeGreaterThanOrEqual(99);
    expect(b.regions.length).toBeLessThanOrEqual(201);
    // saturated, not truncated: the last region still runs to the track end
    const last = b.regions[b.regions.length - 1]!;
    expect(last.x + last.width).toBeCloseTo(79, 1);
  });

  it("an inverted domain falls back to auto-fit so bar length still means value", () => {
    const b = g({ value: 72, target: 80, domain: [100, 0] });
    // under target ⇒ the bar must end LEFT of the tick; the inverted scale put
    // it to the right while the summary still said "72 of 80 target".
    expect(b.measure.x + b.measure.width).toBeLessThan(b.tick!.x);
  });

  it("a flat domain falls back to auto-fit and keeps the track", () => {
    const b = g({ value: 72, target: 80, domain: [50, 50] });
    // the degenerate scale collapsed every band to zero width — no track at all
    expect(b.regions.length).toBeGreaterThan(0);
    expect(b.measure.width).toBeGreaterThan(0);
  });

  it("a height under the pad emits no negative box and nothing above y=0", () => {
    for (const height of [0, 1, 2, 3]) {
      const b = g({ value: 72, target: 80, height });
      expect(b.track.height).toBeGreaterThanOrEqual(0);
      expect(b.measure.height).toBeGreaterThanOrEqual(0);
      if (b.measure.height > 0) {
        expect(b.measure.y).toBeGreaterThanOrEqual(0);
        expect(b.measure.y + b.measure.height).toBeLessThanOrEqual(height + 1e-6);
      }
    }
  });

  it("ordinary heights keep the ⅓ measure untouched", () => {
    expect(g({ value: 50, height: 16 }).measure.height).toBe(4.76);
    expect(g({ value: 50, height: 8 }).measure.height).toBe(2.04);
  });
});

describe("bulletGeometry (invariants)", () => {
  const num = fc.double({ noNaN: true, noDefaultInfinity: true, min: 0, max: 1e4 });
  test.prop([num, num])("bar + tick stay inside the track, no NaN", (value, target) => {
    const b = g({ value, target });
    expect(Number.isNaN(b.measure.width)).toBe(false);
    expect(b.measure.x).toBeGreaterThanOrEqual(1 - 1e-6);
    expect(b.measure.x + b.measure.width).toBeLessThanOrEqual(79 + 1e-6);
    if (b.tick) {
      expect(b.tick.x).toBeGreaterThanOrEqual(1 - 1e-6);
      expect(b.tick.x).toBeLessThanOrEqual(79 + 1e-6);
    }
  });
});
