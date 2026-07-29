import { describe, it, expect } from "vitest";
import { test, fc } from "@fast-check/vitest";
import { describeSeries } from "./summary.js";
import { EN } from "./strings.js";
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

describe("paired templates tolerate an undefined ratio", () => {
  // `pairChange` cannot compute a percent from a zero baseline and returns "".
  // Every paired template concatenated it unguarded, so a Dumbbell of
  // { from: 0, to: 5 } announced "From 0 to 5, up ." — a trailing gap where the
  // number should be, in the accessible name.
  it("fromTo drops the empty ratio, keeps the direction", () => {
    expect(EN.fromTo("0", "5", "up", "")).toBe("From 0 to 5, up.");
    expect(EN.fromTo("0", "5", "up", "40%")).toBe("From 0 to 5, up 40%.");
  });

  it("rows / slopeAt / slopes do the same", () => {
    expect(EN.rows(2, "Berlin", "up", "")).toBe("2 rows. Largest change Berlin, up.");
    expect(EN.slopeAt("A", "0", "5", "up", "")).toBe("A: 0 to 5, up.");
    expect(EN.slopes(3, 2, 1, "A", "up", "")).toBe(
      "3 categories: 2 up, 1 down. Largest change A, up.",
    );
  });

  it("no template leaves a space before its full stop", () => {
    for (const s of [
      EN.fromTo("0", "5", "up", ""),
      EN.rows(2, "B", "down", ""),
      EN.slopeAt("A", "0", "5", "up", ""),
      EN.slopes(3, 2, 1, "A", "up", ""),
    ])
      expect(s).not.toMatch(/\s\.|\s{2}/);
  });
});
