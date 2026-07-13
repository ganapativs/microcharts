import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { criticalPath, traceFoldGeometry } from "./geometry.js";

const TRACE = [
  { label: "request", start: 0, duration: 214, depth: 0 },
  { label: "db.query", start: 10, duration: 86, depth: 1, parent: 0 },
  { label: "auth", start: 0, duration: 8, depth: 1, parent: 0 },
  { label: "render", start: 96, duration: 60, depth: 1, parent: 0 },
  { label: "serialize", start: 156, duration: 40, depth: 1, parent: 0 },
  { label: "index-scan", start: 12, duration: 70, depth: 2, parent: 1 },
  { label: "decode", start: 82, duration: 12, depth: 2, parent: 1 },
  { label: "log", start: 200, duration: 14, depth: 1, parent: 0 },
  { label: "gc", start: 90, duration: 5, depth: 2, parent: 1 },
];

describe("traceFoldGeometry", () => {
  it("walks the critical path (longest-duration child at each level)", () => {
    const flags = criticalPath(TRACE);
    // request → db.query → index-scan
    expect(flags[0]).toBe(true);
    expect(flags[1]).toBe(true);
    expect(flags[5]).toBe(true);
    expect(flags[3]).toBe(false); // render is off-path
  });

  it("longest excludes the root; total is the trace extent", () => {
    const geo = traceFoldGeometry({ data: TRACE, width: 120, height: 32, rowGap: 1 });
    expect(geo.total).toBe(214);
    expect(geo.longest!.label).toBe("db.query");
    expect(geo.longest!.duration).toBe(86);
    expect(geo.longest!.critical).toBe(true);
  });

  it("explicit critical flags override the walk", () => {
    const flags = criticalPath([
      { label: "a", start: 0, duration: 10, depth: 0, critical: true },
      { label: "b", start: 0, duration: 5, depth: 1, parent: 0 },
    ]);
    expect(flags).toEqual([true, false]);
  });

  test.prop([
    fc.array(
      fc.record({
        start: fc.integer({ min: 0, max: 200 }),
        duration: fc.integer({ min: 0, max: 100 }),
        depth: fc.integer({ min: 0, max: 4 }),
      }),
      { minLength: 1, maxLength: 30 },
    ),
  ])("rects stay inside the viewBox", (spans) => {
    const data = spans.map((s, i) => ({ label: `s${i}`, ...s }));
    const geo = traceFoldGeometry({ data, width: 120, height: 40, rowGap: 1 });
    for (const r of geo.rects) {
      expect(r.x).toBeGreaterThanOrEqual(0);
      expect(r.x + r.width).toBeLessThanOrEqual(120.01);
      expect(r.y + r.height).toBeLessThanOrEqual(40.01);
    }
  });
});
