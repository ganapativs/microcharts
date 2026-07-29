import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { gradeLayout, gradeProfileGeometry, type GradePoint } from "./geometry.js";

const base = {
  width: 120,
  height: 40,
  bins: [3, 6, 10] as const,
  topPad: gradeLayout(40, "max").topPad,
};

const TRAIL: GradePoint[] = [
  { d: 0, elev: 800 },
  { d: 100, elev: 809 }, // 9%  → bin 2
  { d: 250, elev: 812 }, // 2%  → bin 0
  { d: 350, elev: 817 }, // 5%  → bin 1
  { d: 500, elev: 835 }, // 12% → bin 3
  { d: 700, elev: 833 }, // -1% → bin 0 (descent)
  { d: 900, elev: 865 }, // 16% → bin 3 (steepest)
];

describe("gradeProfileGeometry", () => {
  it("quantizes each segment's grade into the right bin", () => {
    const geo = gradeProfileGeometry({ ...base, data: TRAIL });
    expect(geo.segments.map((s) => s.bin)).toEqual([2, 0, 1, 3, 0, 3]);
  });

  it("descents always land in the gentlest bin, never a climb colour", () => {
    const geo = gradeProfileGeometry({ ...base, data: TRAIL });
    const descent = geo.segments.find((s) => s.grade < 0)!;
    expect(descent.bin).toBe(0);
  });

  it("reports the steepest climb, its location, distance and gain", () => {
    const geo = gradeProfileGeometry({ ...base, data: TRAIL });
    expect(geo.maxGrade).toBe(16);
    expect(geo.maxGradeAt).toBe(800);
    expect(geo.totalDistance).toBe(900);
    expect(geo.totalGain).toBe(67); // 9 + 3 + 5 + 18 + 0 + 32
  });

  it("collapses to flat-vs-climb below 72 units wide", () => {
    const geo = gradeProfileGeometry({ ...base, width: 60, data: TRAIL });
    expect(geo.collapsed).toBe(true);
    // only bin 0 (flat/descent) and bin 2 (climb) survive the degrade
    expect(new Set(geo.segments.map((s) => s.bin))).toEqual(new Set([0, 2]));
  });

  it("flat route has no climb bins and zero max grade", () => {
    const geo = gradeProfileGeometry({
      ...base,
      data: [
        { d: 0, elev: 500 },
        { d: 200, elev: 500 },
        { d: 400, elev: 500 },
      ],
    });
    expect(geo.maxGrade).toBe(0);
    expect(geo.segments.every((s) => s.bin === 0)).toBe(true);
  });

  it("a non-finite elevation breaks the profile into a gap", () => {
    const geo = gradeProfileGeometry({
      ...base,
      data: [
        { d: 0, elev: 100 },
        { d: 100, elev: 120 },
        { d: 200, elev: Number.NaN },
        { d: 300, elev: 160 },
      ],
    });
    // segments touching the NaN point drop out (0→100 survives; 100→200 and
    // 200→300 do not); the ridge polyline breaks into two runs.
    expect(geo.segments.length).toBe(1);
    expect(geo.ridge.match(/M/g)!.length).toBe(2);
  });

  it("unusable bins fall back to the documented defaults", () => {
    // A host computes thresholds: `Number("")` off an empty field, or a sort
    // that ran descending. Every comparison against NaN is false, so binOf
    // used to fall through to the brutal bin for the whole route.
    const expected = gradeProfileGeometry({ ...base, data: TRAIL }).segments.map((s) => s.bin);
    for (const bins of [
      [NaN, NaN, NaN],
      [3, NaN, 10],
      [Infinity, Infinity, Infinity],
      [-Infinity, 6, 10],
      [10, 6, 3], // descending
    ] as const) {
      const geo = gradeProfileGeometry({ ...base, bins, data: TRAIL });
      expect(
        geo.segments.map((s) => s.bin),
        `bins ${bins.join()}`,
      ).toEqual(expected);
    }
  });

  it("a descent stays in the gentlest bin even under thresholds below zero", () => {
    const geo = gradeProfileGeometry({ ...base, bins: [-5, 0, 5], data: TRAIL });
    expect(geo.segments.map((s) => s.bin)).toEqual([3, 2, 3, 3, 0, 3]);
    expect(geo.segments.find((s) => s.grade < 0)!.bin).toBe(0);
  });

  it("an unrepresentable pitch paints but never becomes the announced steepest", () => {
    // `rise / run` overflows on a sub-normal run: the wall is real, the number
    // is not, and `Intl` renders it "∞". The finite 10% pitch stays the
    // headline; the segment itself still gets a quad.
    const geo = gradeProfileGeometry({
      ...base,
      data: [
        { d: 0, elev: 0 },
        { d: Number.MIN_VALUE, elev: 1 },
        { d: 100, elev: 0 },
        { d: 200, elev: 10 },
      ],
    });
    expect(geo.segments.length).toBe(3);
    expect(geo.maxGrade).toBe(10);
    expect(geo.totalGain).toBe(11);
  });

  it("an elevation span past 1.8e308 flattens instead of emitting NaN coords", () => {
    const geo = gradeProfileGeometry({
      ...base,
      data: [
        { d: 0, elev: -1.7e308 },
        { d: 100, elev: 1.7e308 },
        { d: 200, elev: 1.7e308 },
      ],
    });
    expect(geo.maxGrade).toBe(0);
    expect(geo.totalGain).toBe(0);
    expect([...geo.segments.map((s) => s.path), geo.ridge].join(" ")).not.toMatch(/NaN|Infinity/);
  });

  it("single / empty inputs produce no segments", () => {
    expect(gradeProfileGeometry({ ...base, data: [] }).segments).toEqual([]);
    expect(gradeProfileGeometry({ ...base, data: [{ d: 3, elev: 9 }] }).segments).toEqual([]);
  });

  test.prop([
    fc.array(
      fc.record({
        d: fc.double({ noNaN: true, min: -1e4, max: 1e4 }),
        elev: fc.double({ noNaN: true, min: -1e4, max: 1e4 }),
      }),
      { maxLength: 60 },
    ),
  ])("containment: every emitted coord sits inside the viewBox", (data) => {
    const geo = gradeProfileGeometry({ ...base, data });
    const nums = [...geo.segments.map((s) => s.path), geo.ridge]
      .join(" ")
      .matchAll(/-?\d+(?:\.\d+)?/g);
    for (const m of nums) {
      const v = Number(m[0]);
      expect(v).toBeGreaterThanOrEqual(-0.01);
      expect(v).toBeLessThanOrEqual(120.01);
    }
  });
});
