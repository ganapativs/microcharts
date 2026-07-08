import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { likertStripGeometry } from "./geometry.js";

const base = { width: 60, height: 12, neutral: "split" as const };

describe("likertStripGeometry (plan/22 #30)", () => {
  it("negatives left of center, positives right, neutral straddles (split)", () => {
    const geo = likertStripGeometry({ ...base, values: [10, 20, 14, 30, 26] })!;
    const neg = geo.segments.filter((s) => s.side < 0);
    const pos = geo.segments.filter((s) => s.side > 0);
    const neu = geo.segments.find((s) => s.side === 0)!;
    for (const s of neg) expect(s.x + s.width).toBeLessThanOrEqual(geo.centerX + 0.01);
    for (const s of pos) expect(s.x).toBeGreaterThanOrEqual(geo.centerX - 0.01);
    expect(neu.x).toBeLessThan(geo.centerX);
    expect(neu.x + neu.width).toBeGreaterThan(geo.centerX);
  });

  it("omit removes neutral from the bar but keeps its share", () => {
    const geo = likertStripGeometry({ ...base, neutral: "omit", values: [10, 20, 14, 30, 26] })!;
    expect(geo.segments.find((s) => s.side === 0)).toBeUndefined();
    expect(geo.shares.neutral).toBeCloseTo(0.14, 2);
  });

  it("even level count → halves meet at center exactly", () => {
    const geo = likertStripGeometry({ ...base, values: [25, 25, 25, 25] })!;
    const neg = geo.segments.filter((s) => s.side < 0);
    const pos = geo.segments.filter((s) => s.side > 0);
    expect(Math.max(...neg.map((s) => s.x + s.width))).toBeCloseTo(geo.centerX, 1);
    expect(Math.min(...pos.map((s) => s.x))).toBeCloseTo(geo.centerX, 1);
  });

  it("grading: opacity grows toward the poles, never magnitude", () => {
    const geo = likertStripGeometry({ ...base, values: [10, 20, 14, 30, 26] })!;
    const neg = geo.segments.filter((s) => s.side < 0).sort((a, b) => a.level - b.level);
    expect(neg[0]!.opacity).toBeGreaterThan(neg[1]!.opacity);
  });

  it("zero total → null (No responses)", () => {
    expect(likertStripGeometry({ ...base, values: [0, 0, 0] })).toBeNull();
  });

  test.prop([
    fc.array(fc.double({ min: 0, max: 1e3, noNaN: true }), { minLength: 2, maxLength: 7 }),
    fc.constantFrom<"split" | "omit">("split", "omit"),
  ])("containment + shares sum to 1", (values, neutral) => {
    const geo = likertStripGeometry({ ...base, neutral, values });
    if (!geo) return;
    for (const s of geo.segments) {
      expect(s.x).toBeGreaterThanOrEqual(-0.05);
      expect(s.x + s.width).toBeLessThanOrEqual(60.05);
    }
    const sum = geo.shares.negative + geo.shares.positive + geo.shares.neutral;
    expect(sum).toBeGreaterThan(0.97);
    expect(sum).toBeLessThan(1.03);
  });
});
