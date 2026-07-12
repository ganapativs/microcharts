import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { queueDepthGeometry } from "./geometry.js";

const base = { width: 80, height: 20 };
// a backlog that grows through capacity (100) to 2.14× at the end
const DATA = [42, 55, 70, 88, 96, 120, 150, 182, 214];
const CAP = 100;

describe("queueDepthGeometry", () => {
  it("draws a zero-anchored area, a top edge, and the capacity line", () => {
    const geo = queueDepthGeometry({ ...base, data: DATA, capacity: CAP })!;
    expect(geo.area).toMatch(/^M/);
    expect(geo.line).toMatch(/^M/);
    expect(geo.capacityY).not.toBeNull();
    expect(geo.now).toBe(214);
  });

  it("re-strokes the above-capacity spans and reports the breach ratio", () => {
    const geo = queueDepthGeometry({ ...base, data: DATA, capacity: CAP })!;
    expect(geo.breach).toMatch(/^M/);
    expect(geo.breached).toBe(true);
    expect(geo.ratio).toBeCloseTo(2.14, 2);
    expect(geo.points[geo.points.length - 1]!.above).toBe(true);
  });

  it("no capacity → no breach, no ratio, no capacity line", () => {
    const geo = queueDepthGeometry({ ...base, data: DATA })!;
    expect(geo.breach).toBe("");
    expect(geo.capacityY).toBeNull();
    expect(geo.ratio).toBeNull();
    expect(geo.breached).toBe(false);
  });

  it("always below capacity → no breach spans", () => {
    const geo = queueDepthGeometry({ ...base, data: [10, 20, 30, 25], capacity: 100 })!;
    expect(geo.breach).toBe("");
    expect(geo.breached).toBe(false);
    expect(geo.ratio).toBeCloseTo(0.25, 2);
  });

  it("always above capacity → the breach spans the whole edge", () => {
    const geo = queueDepthGeometry({ ...base, data: [120, 140, 160], capacity: 100 })!;
    expect(geo.breach).toMatch(/^M/);
    expect(geo.breached).toBe(true);
  });

  it("trend follows the last quarter of the window (growing / draining / flat)", () => {
    expect(queueDepthGeometry({ ...base, data: DATA })!.trend).toBe("up");
    expect(queueDepthGeometry({ ...base, data: [214, 182, 150, 96, 60] })!.trend).toBe("down");
    expect(queueDepthGeometry({ ...base, data: [80, 80, 80, 80] })!.trend).toBe("flat");
  });

  it("zero-everywhere → flat, within capacity, no leak", () => {
    const geo = queueDepthGeometry({ ...base, data: [0, 0, 0], capacity: 100 })!;
    expect(geo.now).toBe(0);
    expect(geo.breached).toBe(false);
    expect(geo.trend).toBe("flat");
  });

  it("nulls break the area and the top edge into subpaths", () => {
    const geo = queueDepthGeometry({ ...base, data: [10, null, 40, null, 80], capacity: 100 })!;
    // three finite runs → three move commands in each path
    expect(geo.line.match(/M/g)!.length).toBe(3);
    expect(geo.points.length).toBe(3);
  });

  it("empty / all-null → null", () => {
    expect(queueDepthGeometry({ ...base, data: [] })).toBeNull();
    expect(queueDepthGeometry({ ...base, data: [null, null] })).toBeNull();
  });

  test.prop([
    fc.array(fc.double({ noNaN: true, min: 0, max: 500 }), { minLength: 1, maxLength: 40 }),
    fc.double({ noNaN: true, min: 1, max: 500 }),
  ])("containment: area + top-edge coords inside the plot", (data, capacity) => {
    const geo = queueDepthGeometry({ ...base, data, capacity, fontSize: 8 });
    if (!geo) return;
    for (const d of [geo.area, geo.line, geo.breach]) {
      const ys = [...d.matchAll(/-?[\d.]+ (-?[\d.]+)/g)].map((m) => Number(m[1]));
      for (const y of ys) {
        expect(y).toBeGreaterThanOrEqual(1.99);
        expect(y).toBeLessThanOrEqual(18.01);
      }
    }
  });
});
