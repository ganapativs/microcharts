import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { maxPerBucket } from "../../core/downsample.js";
import { bucketCount, waveformGeometry } from "./geometry.js";

const noiseWithSpike = (n: number, spikeAt: number, spike: number) =>
  Array.from({ length: n }, (_, i) => (i === spikeAt ? spike : Math.sin(i / 3) * 0.15));

describe("waveformGeometry", () => {
  it("max-per-bucket: a lone spike survives compression, never averaged away", () => {
    const data = noiseWithSpike(200, 126, 0.82);
    const buckets = bucketCount(120, 200);
    const geo = waveformGeometry({
      data,
      width: 120,
      height: 24,
      buckets,
      domain: null,
      mirror: true,
    });
    // the peak bucket's bar is the tallest
    const tallest = geo.bars.reduce((a, b) => (b.height > a.height ? b : a));
    expect(geo.peak).toBeCloseTo(0.82, 2);
    expect(geo.bars[geo.peakIndex]!.height).toBe(tallest.height);
  });

  it("every bucket bar height ≥ the true bucket max (property, mean would fail)", () => {
    const data = noiseWithSpike(240, 100, 1);
    const k = 30;
    const vals = maxPerBucket(data, k, { abs: true });
    const geo = waveformGeometry({
      data,
      width: 120,
      height: 24,
      buckets: k,
      domain: null,
      mirror: true,
    });
    const dmax = 1;
    vals.forEach((v, i) => {
      const expectedFrac = v == null ? 0 : Math.abs(v) / dmax;
      const half = geo.bars[i]!.height / 2;
      // half-height should track the bucket's abs-max fraction
      expect(half).toBeGreaterThanOrEqual(expectedFrac * (24 / 2 - 1) - 0.6);
    });
  });

  it("all-silence → zero-amplitude bars (flat)", () => {
    const geo = waveformGeometry({
      data: [0, 0, 0, 0],
      width: 40,
      height: 24,
      buckets: 4,
      domain: null,
      mirror: true,
    });
    expect(geo.peak).toBe(0);
    expect(geo.bars.every((b) => b.height === 0)).toBe(true);
    // The PAINT has to agree with `bars`. It used to floor a silent bucket to a
    // 0.4-unit tick, so a run of silence read as a dotted rule under bars that
    // all reported zero.
    expect(geo.path).toBe("");
  });

  it("silence contributes no subpath; sound still does", () => {
    const geo = waveformGeometry({
      data: [0, 0.8, 0, 0.4],
      width: 40,
      height: 24,
      buckets: 4,
      domain: null,
      mirror: true,
    });
    expect(geo.path.match(/M/g)).toHaveLength(2);
  });

  test.prop([
    fc.array(fc.double({ min: -1, max: 1, noNaN: true }), { minLength: 1, maxLength: 500 }),
  ])("containment: every bar inside the viewBox", (data) => {
    const buckets = bucketCount(120, data.length);
    const geo = waveformGeometry({
      data,
      width: 120,
      height: 24,
      buckets,
      domain: null,
      mirror: true,
    });
    for (const b of geo.bars) {
      expect(b.x).toBeGreaterThanOrEqual(0);
      expect(b.x + b.width).toBeLessThanOrEqual(120.01);
      expect(b.y).toBeGreaterThanOrEqual(-0.01);
      expect(b.y + b.height).toBeLessThanOrEqual(24.01);
    }
  });
});
