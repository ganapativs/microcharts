import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { rateVolumeGeometry, type RateVolumePoint } from "./geometry.js";

const base = { width: 80, height: 20 };
const SAMPLE: RateVolumePoint[] = [
  { rate: 2.3, volume: 120 },
  { rate: 3.1, volume: 90 },
  { rate: 2.8, volume: 140 },
  { rate: 4.1, volume: 38 },
];

describe("rateVolumeGeometry", () => {
  it("one bar per period, zero-anchored (bottom edge)", () => {
    const geo = rateVolumeGeometry({ ...base, data: SAMPLE })!;
    expect(geo.bars).toHaveLength(4);
    const bottom = base.height - 2; // pad
    for (const b of geo.bars) {
      expect(round(b.y + b.height)).toBe(bottom);
      expect(b.height).toBeGreaterThan(0);
    }
  });

  it("taller volume → taller bar", () => {
    const geo = rateVolumeGeometry({ ...base, data: SAMPLE })!;
    // period 0 (vol 120) taller than period 3 (vol 38)
    expect(geo.bars[0]!.height).toBeGreaterThan(geo.bars[3]!.height);
  });

  it("line + point per plottable period; last is the endpoint", () => {
    const geo = rateVolumeGeometry({ ...base, data: SAMPLE })!;
    expect(geo.points).toHaveLength(4);
    expect(geo.line.d).toMatch(/^M/);
    expect(geo.last).not.toBeNull();
    expect(geo.last!.rate).toBe(4.1);
    expect(geo.last!.volume).toBe(38);
    expect(geo.firstRate).toBe(2.3);
    expect(geo.n).toBe(4);
  });

  it("minVolume marks low-denominator points as hollow (shape cue)", () => {
    const geo = rateVolumeGeometry({ ...base, data: SAMPLE, minVolume: 50 })!;
    // only period 3 (vol 38) is below 50
    expect(geo.points.map((p) => p.low)).toEqual([false, false, false, true]);
    expect(geo.last!.low).toBe(true);
  });

  it("volume === 0 → rate undefined: line gap + zero-height bar, skipped from points", () => {
    const data: RateVolumePoint[] = [
      { rate: 2, volume: 100 },
      { rate: 9, volume: 0 }, // 100% jump on 0 events — never plotted
      { rate: 3, volume: 80 },
    ];
    const geo = rateVolumeGeometry({ ...base, data })!;
    expect(geo.bars[1]!.height).toBe(0); // zero-height bar
    expect(geo.points).toHaveLength(2); // middle period skipped
    // line breaks into two subpaths (a gap), so two moves
    expect(geo.line.d.match(/M/g)).toHaveLength(2);
    expect(geo.last!.rate).toBe(3);
    expect(geo.firstRate).toBe(2);
  });

  it("null/NaN rate with volume present → line gap, bar still drawn", () => {
    const data: RateVolumePoint[] = [
      { rate: 2, volume: 100 },
      { rate: Number.NaN, volume: 60 },
      { rate: 3, volume: 80 },
    ];
    const geo = rateVolumeGeometry({ ...base, data })!;
    expect(geo.bars[1]!.height).toBeGreaterThan(0); // bar drawn for the volume
    expect(geo.points).toHaveLength(2); // no rate point
    expect(geo.line.d.match(/M/g)).toHaveLength(2);
  });

  it("all volumes equal → flat bars (correct, not a bug)", () => {
    const data: RateVolumePoint[] = [
      { rate: 1, volume: 50 },
      { rate: 5, volume: 50 },
      { rate: 3, volume: 50 },
    ];
    const geo = rateVolumeGeometry({ ...base, data })!;
    const h = geo.bars[0]!.height;
    expect(geo.bars.every((b) => b.height === h)).toBe(true);
  });

  it("empty → null", () => {
    expect(rateVolumeGeometry({ ...base, data: [] })).toBeNull();
  });

  it("all-zero volume (no denominator anywhere) → null", () => {
    const data: RateVolumePoint[] = [
      { rate: 2, volume: 0 },
      { rate: 3, volume: 0 },
    ];
    expect(rateVolumeGeometry({ ...base, data })).toBeNull();
  });

  it("volumeDomain scales the bars when it is a real scale", () => {
    // top of the volume scale at 240 → the 120-volume bar is half height
    const geo = rateVolumeGeometry({ ...base, data: SAMPLE, volumeDomain: [0, 240] })!;
    const plotH = base.height - 4; // pad top + bottom
    expect(geo.bars[0]!.height).toBeCloseTo(plotH / 2, 1);
  });

  // A host computes `volumeDomain` as `[0, Math.max(...volumes)]`; one hole in
  // the series makes that `[0, NaN]`. `scaleLinear` maps a non-finite span to
  // its range midpoint, so every ghost bar used to come out the same
  // half-height block — a denominator that encodes nothing, drawn as though it
  // did. The rate `domain` already guarded this; the volume scale did not.
  it.each([
    ["NaN top", [0, Number.NaN]],
    ["NaN bottom", [Number.NaN, 200]],
    ["infinite top", [0, Number.POSITIVE_INFINITY]],
    ["infinite bottom", [Number.NEGATIVE_INFINITY, 200]],
    ["zero span", [0, 0]],
    ["reversed", [200, 0]],
  ] as const)("unusable volumeDomain (%s) falls back to [0, max]", (_name, vd) => {
    const fallback = rateVolumeGeometry({ ...base, data: SAMPLE })!;
    const geo = rateVolumeGeometry({
      ...base,
      data: SAMPLE,
      volumeDomain: vd as readonly [number, number],
    })!;
    expect(geo.bars.map((b) => b.height)).toEqual(fallback.bars.map((b) => b.height));
    // and the bars still rank by volume rather than flattening to one block
    expect(geo.bars[0]!.height).toBeGreaterThan(geo.bars[3]!.height);
  });

  it("a long series does not blow the call stack", () => {
    // `Math.max(0, ...volumes)` threw RangeError here — `data` is caller-sized
    // and the spread pushes one argument per period.
    const data: RateVolumePoint[] = Array.from({ length: 200_000 }, (_, i) => ({
      rate: i % 7,
      volume: i + 1,
    }));
    const geo = rateVolumeGeometry({ ...base, data })!;
    expect(geo.n).toBe(200_000);
    expect(geo.last!.volume).toBe(200_000);
  });

  it("step curve emits H/V", () => {
    const geo = rateVolumeGeometry({ ...base, data: SAMPLE, curve: "step" })!;
    expect(geo.line.d).toMatch(/H/);
  });

  test.prop([
    fc.array(
      fc.record({
        rate: fc.double({ noNaN: true, min: -1e4, max: 1e4 }),
        volume: fc.double({ noNaN: true, min: 0, max: 1e6 }),
      }),
      { minLength: 1, maxLength: 60 },
    ),
  ])("containment: bars + points inside the plot", (data) => {
    const geo = rateVolumeGeometry({ ...base, data, gutterCh: 4, fontSize: 8 });
    if (!geo) return;
    for (const b of geo.bars) {
      expect(b.x).toBeGreaterThanOrEqual(-0.01);
      expect(b.x + b.width).toBeLessThanOrEqual(80.01);
      expect(b.y).toBeGreaterThanOrEqual(1.99);
      expect(round(b.y + b.height)).toBeLessThanOrEqual(18.01);
    }
    for (const p of geo.points) {
      expect(p.x).toBeGreaterThanOrEqual(1.99);
      expect(p.x).toBeLessThanOrEqual(78.01);
      expect(p.y).toBeGreaterThanOrEqual(1.99);
      expect(p.y).toBeLessThanOrEqual(18.01);
    }
  });
});

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
