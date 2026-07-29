import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { bumpGeometry } from "./geometry.js";

const base = { width: 60, height: 16, gutterLeftCh: 2, gutterRightCh: 2, fontSize: 6 };

describe("bumpGeometry", () => {
  it("rank 1 sits at the TOP (inverted y, documented)", () => {
    const geo = bumpGeometry({ ...base, ranks: [1, 5] });
    expect(geo.points[0]!.y).toBeLessThan(geo.points[1]!.y);
  });

  it("step line: change dots only where rank moved", () => {
    const geo = bumpGeometry({ ...base, ranks: [3, 3, 2, 2, 5] });
    expect(geo.changes.length).toBe(2); // 3→2 and 2→5
    expect(geo.d).toContain("V"); // vertical steps
  });

  it("null periods break the line (gaps, never diagonal interpolation)", () => {
    const geo = bumpGeometry({ ...base, ranks: [3, null, 2] });
    expect((geo.d.match(/M/g) ?? []).length).toBe(2);
  });

  it("a period with gaps on both sides is reported isolated (a lone M never strokes)", () => {
    const both = bumpGeometry({ ...base, ranks: [3, null, 2] });
    expect(both.isolated).toEqual([
      { x: both.points[0]!.x, y: both.points[0]!.y },
      { x: both.points[1]!.x, y: both.points[1]!.y },
    ]);
    expect(bumpGeometry({ ...base, ranks: [3] }).isolated.length).toBe(1);
    // a run of two is connected — the path paints it, so no dot
    expect(bumpGeometry({ ...base, ranks: [3, 2, null, 1] }).isolated.length).toBe(1);
    expect(bumpGeometry({ ...base, ranks: [3, 3, 2] }).isolated).toEqual([]);
  });

  it("an unusable maxRank is ignored, not painted (NaN / ±Infinity / < 1)", () => {
    const auto = bumpGeometry({ ...base, ranks: [1, 3, 5] });
    for (const bad of [Number.NaN, Infinity, -Infinity, 0, -5, 0.5]) {
      const geo = bumpGeometry({ ...base, ranks: [1, 3, 5], maxRank: bad });
      expect(geo.d, `maxRank=${bad}`).toBe(auto.d);
      expect(geo.d).not.toMatch(/NaN|Infinity/);
    }
  });

  it("maxRank fixes the band scale; ranks beyond clamp to the bottom", () => {
    const fixed = bumpGeometry({ ...base, ranks: [1, 2], maxRank: 10 });
    const auto = bumpGeometry({ ...base, ranks: [1, 2] });
    expect(fixed.points[1]!.y).toBeLessThan(auto.points[1]!.y); // rank 2 of 10 sits higher
    const over = bumpGeometry({ ...base, ranks: [12], maxRank: 10 });
    expect(over.points[0]!.y).toBeCloseTo(16 - 1.5, 1);
  });

  test.prop([
    fc.array(fc.option(fc.integer({ min: 1, max: 20 }), { nil: null }), { maxLength: 30 }),
  ])("containment: points + labels inside the box", (ranks) => {
    const geo = bumpGeometry({ ...base, ranks });
    for (const p of [...geo.points, ...geo.changes, ...geo.isolated]) {
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThanOrEqual(60);
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeLessThanOrEqual(16);
    }
  });
});
