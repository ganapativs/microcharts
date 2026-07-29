import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import {
  likertBarHeight,
  likertBox,
  likertFont,
  likertGutter,
  likertLabels,
  likertStripGeometry,
} from "./geometry.js";

const base = { width: 60, height: 14, neutral: "split" as const };

describe("likertStripGeometry", () => {
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

  it("unequal poles fill the plot — no empty short-side gutter in the bar", () => {
    const geo = likertStripGeometry({
      ...base,
      width: 760,
      values: [12, 10, 21, 33, 24],
      gutterL: 32,
      gutterR: 32,
    })!;
    const left = Math.min(...geo.segments.map((s) => s.x));
    const right = Math.max(...geo.segments.map((s) => s.x + s.width));
    expect(left).toBeCloseTo(32, 0);
    expect(right).toBeCloseTo(728, 0);
    // lean positive → center sits left of the frame midpoint
    expect(geo.centerX).toBeLessThan((32 + 728) / 2);
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

describe("likertBox (the box <Chart> actually paints)", () => {
  it("clamps a non-finite or non-positive side to 1, like <Chart>", () => {
    expect(likertBox(60, 14)).toEqual([60, 14]);
    expect(likertBox(NaN, 14)).toEqual([1, 14]);
    expect(likertBox(60, Infinity)).toEqual([60, 1]);
    expect(likertBox(0, -14)).toEqual([1, 1]);
  });

  it("bar thickness insets the strip and floors at 3", () => {
    expect(likertBarHeight(14)).toBe(10);
    expect(likertBarHeight(1)).toBe(3);
  });
});

describe("likertGutter (shared static/interactive gutter)", () => {
  it("is 0 without end labels and a deterministic 4-char reserve with them", () => {
    const font = likertFont(14);
    expect(likertGutter(false, font)).toBe(0);
    expect(likertGutter(true, font)).toBe(Math.ceil(4 * font * 0.62) + 4);
  });

  it("drops the labels AND their gutter once the plot is thinner than the bar", () => {
    const font = likertFont(14);
    const arg = { labelled: true, height: 14, fontSize: font, widest: 4 };
    // 60×14: two 22-unit reserves leave 16 units of plot against a 10-unit bar.
    expect(likertLabels({ ...arg, width: 60 })).toEqual({ show: true, gutter: 22 });
    // 40×14: the reserves are wider than the box. Every segment used to come out
    // negative-width and vanish, leaving two percents stacked on empty plot.
    expect(likertLabels({ ...arg, width: 40 })).toEqual({ show: false, gutter: 0 });
    expect(likertLabels({ ...arg, width: 53 }).show).toBe(false);
    expect(likertLabels({ ...arg, width: 54 }).show).toBe(true); // plot 10 = barH 10
  });

  it("a caller format wide enough to swallow the plot drops the labels", () => {
    // `format={(n) => `${n * 100} percent`}` → a 14-char reserve either side.
    const font = likertFont(14);
    const fit = likertLabels({ labelled: true, width: 90, height: 14, fontSize: font, widest: 14 });
    expect(fit).toEqual({ show: false, gutter: 0 });
  });

  it("shrinks the plot — both entries must pass the same value", () => {
    const g = likertGutter(true, likertFont(14));
    const wide = likertStripGeometry({ ...base, values: [1, 2, 3], gutterL: 0, gutterR: 0 });
    const gutted = likertStripGeometry({ ...base, values: [1, 2, 3], gutterL: g, gutterR: g });
    const span = (geo: NonNullable<ReturnType<typeof likertStripGeometry>>): number =>
      Math.max(...geo.segments.map((s) => s.x + s.width)) -
      Math.min(...geo.segments.map((s) => s.x));
    expect(span(gutted!)).toBeLessThan(span(wide!));
    expect(gutted!.segments[0]!.x).toBeGreaterThanOrEqual(g);
  });
});
