import { describe, it, expect } from "vitest";
import { test, fc } from "@fast-check/vitest";
import { describeSeries } from "./summary.js";
import type { Value } from "./types.js";

describe("describeSeries (edge matrix)", () => {
  it("empty → No data.", () => expect(describeSeries([])).toBe("No data."));
  it("all-null → No data.", () => expect(describeSeries([null, null])).toBe("No data."));
  it("non-finite only → No data.", () => expect(describeSeries([NaN, Infinity])).toBe("No data."));
  it("single → Single value.", () => expect(describeSeries([7])).toBe("Single value 7."));
  it("all-equal → Flat.", () => expect(describeSeries([4, 4, 4])).toBe("Flat at 4."));
});

describe("describeSeries (trend wording)", () => {
  it("upward trend with percent", () => {
    expect(describeSeries([10, 20])).toBe("Trending up 100%. Range 10 to 20. Last value 20.");
  });
  it("downward trend with percent", () => {
    expect(describeSeries([20, 10])).toBe("Trending down 50%. Range 10 to 20. Last value 10.");
  });
  it("first value 0 → absolute wording (no divide-by-zero)", () => {
    expect(describeSeries([0, 5, 3])).toContain("Trending up by 3.");
  });
  it("net-flat but varied → No net change.", () => {
    expect(describeSeries([5, 9, 5])).toBe("No net change. Range 5 to 9. Last value 5.");
  });
});

describe("describeSeries (formatting + i18n hooks)", () => {
  it("respects Intl.NumberFormat options", () => {
    const out = describeSeries([1000, 2000], { format: { notation: "compact" } });
    expect(out).toContain("Last value 2K.");
  });
  it("accepts a custom formatter", () => {
    const out = describeSeries([1, 2], { format: (n) => `$${n}` });
    expect(out).toContain("Last value $2.");
  });
});

const finite = fc.double({ noNaN: true, noDefaultInfinity: true, min: -1e6, max: 1e6 });
const value: fc.Arbitrary<Value> = fc.oneof(finite, fc.constant(null));

describe("describeSeries (invariants)", () => {
  test.prop([fc.array(value)])("always returns a non-empty string ending in a period", (xs) => {
    const out = describeSeries(xs);
    expect(out.length).toBeGreaterThan(0);
    expect(out.endsWith(".")).toBe(true);
  });
});
