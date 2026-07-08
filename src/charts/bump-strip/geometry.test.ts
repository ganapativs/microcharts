import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { bumpGeometry } from "./geometry.js";

const base = { width: 60, height: 16, gutterLeftCh: 2, gutterRightCh: 2, fontSize: 6 };

describe("bumpGeometry (plan/22 #21)", () => {
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
    for (const p of geo.points) {
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThanOrEqual(60);
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeLessThanOrEqual(16);
    }
  });
});
