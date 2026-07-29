import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { hatchPath, minimapDomain, minimapFog, minimapGeometry } from "./geometry.js";

const CONTENT = Array.from({ length: 1200 }, (_, i) => Math.sin(i / 40) + 1);

describe("minimapGeometry", () => {
  it("maps the window linearly and downsamples content", () => {
    const geo = minimapGeometry({
      content: CONTENT,
      window: [520, 660],
      marks: [100, 600, 1100],
      known: [[0, 1104]],
      domain: [0, 1200],
      width: 120,
      height: 16,
    });
    expect(geo.buckets.length).toBeGreaterThan(1);
    expect(geo.windowRect.x).toBeGreaterThan(0);
    expect(geo.markX.length).toBe(3);
  });

  it("fog covers unknown regions; unknown share is disclosed", () => {
    const geo = minimapGeometry({
      content: CONTENT,
      window: [520, 660],
      marks: [],
      known: [[0, 1104]],
      domain: [0, 1200],
      width: 120,
      height: 16,
    });
    expect(geo.fogRects.length).toBe(1);
    expect(geo.unknownShare).toBeCloseTo(0.08, 2);
  });

  it("full known coverage → no fog", () => {
    const geo = minimapGeometry({
      content: CONTENT,
      window: [0, 1200],
      marks: [],
      known: [[0, 1200]],
      domain: [0, 1200],
      width: 120,
      height: 16,
    });
    expect(geo.fogRects.length).toBe(0);
    expect(geo.unknownShare).toBe(0);
  });

  it("the annotation lane scales with height (legible ticks on tall strips)", () => {
    const at = (height: number) =>
      minimapGeometry({
        content: CONTENT,
        window: [0, 1200],
        marks: [600],
        known: [[0, 1200]],
        domain: [0, 1200],
        width: 120,
        height,
      }).contentTop;
    // taller strip → deeper lane (was a fixed 2u sliver), clamped so it never
    // eats the content band, and content always sits below it.
    expect(at(40)).toBeGreaterThan(at(12));
    expect(at(12)).toBeGreaterThanOrEqual(3);
    expect(at(200)).toBeLessThanOrEqual(7);
  });

  it("a hairline strip still has a content band, never a negative one", () => {
    // At height ≤ 3 the lane's 2u floor cost more than the box had, so every
    // content height came out negative: `height="-1"` is an SVG error and the
    // fog and bars stopped rendering.
    for (const height of [1, 2, 3, 4, 5]) {
      const geo = minimapGeometry({
        content: CONTENT,
        window: [0, 600],
        marks: [300],
        known: [[0, 600]],
        domain: [0, 1200],
        width: 120,
        height,
      });
      expect(geo.contentTop, `height ${height}`).toBeLessThanOrEqual(geo.contentBottom);
      for (const b of geo.buckets) expect(b.height, `height ${height}`).toBeGreaterThanOrEqual(0);
      for (const f of geo.fogRects) expect(f.height, `height ${height}`).toBeGreaterThanOrEqual(0);
      expect(geo.windowRect.height, `height ${height}`).toBeGreaterThanOrEqual(0);
    }
  });

  it("hatch stride holds at 2.5, then coarsens rather than growing without bound", () => {
    const starts = (d: string) => [...d.matchAll(/M(-?[\d.]+) /g)].map((m) => Number(m[1]!));
    const ordinary = starts(hatchPath({ x: 1, y: 4, width: 118, height: 11 })).filter((x) => x > 1);
    expect(ordinary[1]! - ordinary[0]!).toBeCloseTo(2.5, 2);
    // `width` is a caller prop: walking a 1e6-unit rect at 2.5 built an 8 MB
    // `d` string, and 1e7 exhausted memory before it painted.
    const huge = starts(hatchPath({ x: 1, y: 4, width: 999_998, height: 11 }));
    expect(huge.length).toBeLessThanOrEqual(400);
    // …and the fog still reaches the far edge; it is coarser, not truncated.
    expect(huge.at(-1)!).toBeGreaterThan(990_000);
  });

  it("minimapFog is the same sweep the geometry paints", () => {
    const known: [number, number][] = [
      [0, 200],
      [400, 500],
    ];
    const domain: [number, number] = [0, 1000];
    const fog = minimapFog(known, domain);
    const geo = minimapGeometry({
      content: CONTENT,
      window: [0, 100],
      marks: [],
      known,
      domain,
      width: 120,
      height: 16,
    });
    expect(fog.unknownShare).toBe(geo.unknownShare);
    expect(fog.gaps.length).toBe(geo.fogRects.length);
    // no `known` at all still means "all known" — absence of the prop is not
    // absence of data.
    expect(minimapFog(undefined, domain).unknownShare).toBe(0);
  });

  it("default domain spans content + window + marks + known", () => {
    expect(minimapDomain({ content: CONTENT, window: [520, 660] })).toEqual([0, 1200]);
  });

  test.prop([fc.integer({ min: 0, max: 500 }), fc.integer({ min: 0, max: 500 })])(
    "window rect stays inside the strip",
    (a, b) => {
      const geo = minimapGeometry({
        content: CONTENT.slice(0, 600),
        window: [Math.min(a, b), Math.max(a, b) + 1],
        marks: [],
        known: [],
        domain: [0, 600],
        width: 120,
        height: 16,
      });
      expect(geo.windowRect.x).toBeGreaterThanOrEqual(0);
      expect(geo.windowRect.x + geo.windowRect.width).toBeLessThanOrEqual(120.5);
    },
  );
});
