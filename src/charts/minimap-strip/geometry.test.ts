import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { minimapDomain, minimapGeometry } from "./geometry.js";

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
