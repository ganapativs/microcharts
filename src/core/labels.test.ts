import { describe, it, expect } from "vitest";
import { fc, test } from "@fast-check/vitest";
import {
  spreadLabels,
  rowLabelFont,
  rowLabelChars,
  ROW_LABEL_MAX_CHARS,
  ROW_LABEL_MIN_CHARS,
} from "./labels.js";

describe("spreadLabels", () => {
  it("leaves already-spaced labels alone", () => {
    expect(spreadLabels([10, 30, 50], 6, 0, 60)).toEqual([10, 30, 50]);
  });

  it("nudges colliding labels apart, preserving input order", () => {
    const out = spreadLabels([20, 22, 24], 6, 0, 60)!;
    expect(out[1]! - out[0]!).toBeGreaterThanOrEqual(6);
    expect(out[2]! - out[1]!).toBeGreaterThanOrEqual(6);
  });

  it("pulls overflow back from the bottom edge", () => {
    const out = spreadLabels([55, 57, 59], 6, 0, 60)!;
    expect(Math.max(...out)).toBeLessThanOrEqual(60);
    expect(Math.min(...out)).toBeGreaterThanOrEqual(0);
  });

  it("returns null when the band cannot hold them", () => {
    expect(spreadLabels([1, 2, 3, 4, 5], 10, 0, 20)).toBeNull();
  });

  it("empty input → empty output", () => {
    expect(spreadLabels([], 5, 0, 10)).toEqual([]);
  });

  test.prop([
    fc.array(fc.double({ min: 0, max: 100, noNaN: true }), { minLength: 1, maxLength: 12 }),
    fc.double({ min: 0.5, max: 10, noNaN: true }),
  ])("output honors pitch, band, and rank order", (ys, pitch) => {
    const out = spreadLabels(ys, pitch, 0, 100);
    if ((ys.length - 1) * pitch > 100) {
      expect(out).toBeNull();
      return;
    }
    expect(out).not.toBeNull();
    const sortedIdx = ys.map((y, i) => i).sort((a, b) => ys[a]! - ys[b]! || a - b);
    for (let k = 1; k < sortedIdx.length; k++) {
      const gap = out![sortedIdx[k]!]! - out![sortedIdx[k - 1]!]!;
      expect(gap).toBeGreaterThanOrEqual(pitch - 0.02); // 2-dp rounding
    }
    for (const v of out!) {
      expect(v).toBeGreaterThanOrEqual(-0.01);
      expect(v).toBeLessThanOrEqual(100.01);
    }
  });
});

describe("row labels (one policy for the whole stacked family)", () => {
  it("sizes off the row pitch, not the chart height", () => {
    // The bug this replaces: Dumbbell fed the HEIGHT to labelFont, so adding
    // rows grew the type while the room per row stayed put.
    const pitch = 12;
    for (const rows of [2, 3, 5, 8]) {
      expect(rowLabelFont(pitch)).toBe(rowLabelFont(pitch));
      // height grows with rows; the answer must not
      expect(rowLabelFont((rows * pitch) / rows)).toBe(rowLabelFont(pitch));
    }
  });

  it("holds the library's own floor and ceiling", () => {
    expect(rowLabelFont(0)).toBe(7);
    expect(rowLabelFont(1000)).toBe(11);
  });

  it("drops the label rather than truncating it to a stub", () => {
    const fs = rowLabelFont(12);
    // A gutter too narrow for a useful truncation returns 0 = drop, and the
    // caller hands the space back to the plot.
    expect(rowLabelChars(10, fs, 13)).toBe(0);
    // Roomy enough → a real truncation, capped.
    expect(rowLabelChars(200, fs, 40)).toBe(ROW_LABEL_MAX_CHARS);
  });

  it("never asks for more characters than the label has", () => {
    expect(rowLabelChars(200, rowLabelFont(12), 4)).toBe(4);
  });

  it("a short label still shows when it fits whole, even in a narrow gutter", () => {
    // "AB" is 2 chars; the min-useful floor is about truncation, not about
    // refusing labels that need no truncating at all.
    const fs = rowLabelFont(12);
    expect(rowLabelChars(30, fs, 2)).toBe(2);
  });

  test.prop([
    fc.double({ min: 0, max: 400, noNaN: true }),
    fc.integer({ min: 1, max: 60 }),
    fc.double({ min: 1, max: 60, noNaN: true }),
  ])(
    "never returns a stub: the answer is 0, or at least the useful floor",
    (room, longest, pitch) => {
      const n = rowLabelChars(room, rowLabelFont(pitch), longest);
      expect(n === 0 || n >= Math.min(ROW_LABEL_MIN_CHARS, longest)).toBe(true);
      expect(n).toBeLessThanOrEqual(Math.min(ROW_LABEL_MAX_CHARS, longest));
    },
  );
});
