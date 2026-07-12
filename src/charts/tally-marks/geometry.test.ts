import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { tallyGeometry, TALLY_MAX_MARKS } from "./geometry.js";

const base = { total: 25, height: 16, pad: 2, fontSize: 9 } as const;
const g = (
  value: number,
  over: "numeral" | "clamp" = "numeral",
  pen: "ruled" | "drawn" = "ruled",
) => tallyGeometry({ ...base, value, overflow: over, pen });
const strokes = (d: string) => (d.match(/M/g) ?? []).length;

describe("tallyGeometry — count the way a human counts", () => {
  it("one stroke per count: 4 verticals + a strike per cluster of five", () => {
    // 23 = four struck clusters (20) + three remainder verticals = 23 strokes
    const r = g(23);
    expect(r.drawn).toBe(23);
    expect(strokes(r.d)).toBe(23);
    expect(r.overflow).toBe(0);
    expect(r.numeralX).toBeNull();
  });

  it("value > total → marks cap at total, numeral carries the rest", () => {
    const r = g(27);
    expect(r.drawn).toBe(25);
    expect(r.overflow).toBe(2);
    expect(strokes(r.d)).toBe(25);
    expect(r.numeralX).not.toBeNull();
  });

  it("overflow='clamp' stops drawing without a numeral (summary keeps truth)", () => {
    const r = g(30, "clamp");
    expect(r.drawn).toBe(25);
    expect(r.overflow).toBe(5); // reported for the summary, not drawn
    expect(r.numeralX).toBeNull();
  });

  it("value 0 → no marks, still a valid (≥1) width", () => {
    const r = g(0);
    expect(r.d).toBe("");
    expect(r.drawn).toBe(0);
    expect(r.width).toBeGreaterThanOrEqual(1);
  });

  it("negatives clamp to 0; non-integers floor", () => {
    expect(g(-5).drawn).toBe(0);
    expect(g(3.9).drawn).toBe(3);
    expect(strokes(g(3.9).d)).toBe(3);
  });

  it("the drawn pen is deterministic (seed from count)", () => {
    expect(g(17, "numeral", "drawn").d).toBe(g(17, "numeral", "drawn").d);
    // and differs from the ruled rendering (jittered coords)
    expect(g(17, "numeral", "drawn").d).not.toBe(g(17).d);
  });

  it("saturates a non-physical total — bounded marks, numeral carries the rest", () => {
    // value 1e15 with total 1e15 once looped ~1e15 times (unbounded alloc, runaway
    // width); drawn must clamp to TALLY_MAX_MARKS while overflow stays truthful.
    const r = tallyGeometry({
      ...base,
      total: 1e15,
      value: 1e15,
      overflow: "numeral",
      pen: "ruled",
    });
    expect(r.drawn).toBe(TALLY_MAX_MARKS);
    expect(r.overflow).toBe(1e15 - TALLY_MAX_MARKS);
    const nums = (r.d.match(/-?\d+\.?\d*/g) ?? []).map(Number);
    for (let i = 0; i < nums.length; i += 2) {
      expect(nums[i]!).toBeGreaterThanOrEqual(0);
      expect(nums[i]!).toBeLessThanOrEqual(r.width);
      expect(nums[i + 1]!).toBeGreaterThanOrEqual(0);
      expect(nums[i + 1]!).toBeLessThanOrEqual(base.height);
    }
  });

  // the 1e15 clamp is covered explicitly above; cap runs so the ≤200-mark grids
  // stay fast on CI
  test.prop(
    [
      fc.integer({ min: 0, max: 250 }),
      fc.integer({ min: 0, max: 250 }),
      fc.constantFrom("ruled", "drawn" as const),
    ],
    { numRuns: 40 },
  )("every coord stays within the viewBox", (value, total, pen) => {
    const r = tallyGeometry({
      ...base,
      total,
      value,
      overflow: "numeral",
      pen: pen as "ruled" | "drawn",
    });
    expect(r.drawn).toBeLessThanOrEqual(TALLY_MAX_MARKS);
    const nums = (r.d.match(/-?\d+\.?\d*/g) ?? []).map(Number);
    for (let i = 0; i < nums.length; i += 2) {
      const x = nums[i]!;
      const y = nums[i + 1]!;
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThanOrEqual(r.width);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThanOrEqual(base.height);
    }
  });
});
