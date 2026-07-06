import { describe, it, expect } from "vitest";
import { test, fc } from "@fast-check/vitest";
import { bankTo45 } from "./bank.js";
import type { Value } from "./types.js";

const finite = fc.double({ noNaN: true, noDefaultInfinity: true, min: -1e4, max: 1e4 });
const value: fc.Arbitrary<Value> = fc.oneof(finite, fc.constant(null));

describe("bankTo45 (edge matrix)", () => {
  it("fewer than 2 finite points → 4:1 fallback", () => {
    expect(bankTo45([], 20)).toBe(80);
    expect(bankTo45([5], 20)).toBe(80);
    expect(bankTo45([null, 5, null], 20)).toBe(80);
  });
  it("flat series → 4:1 fallback", () => {
    expect(bankTo45([3, 3, 3], 20)).toBe(80);
  });
});

describe("bankTo45 (invariants)", () => {
  test.prop([fc.array(value, { minLength: 2 }), fc.integer({ min: 8, max: 200 })])(
    "result is finite and clamped to [height, height*20]",
    (xs, height) => {
      const w = bankTo45(xs, height);
      expect(Number.isFinite(w)).toBe(true);
      expect(w).toBeGreaterThanOrEqual(height);
      expect(w).toBeLessThanOrEqual(height * 20);
    },
  );

  it("steeper data suggests a wider box than gentle data", () => {
    const gentle = bankTo45([0, 0.1, 0.2, 0.3], 20);
    const steep = bankTo45([0, 10, 0, 10], 20);
    expect(steep).toBeGreaterThan(gentle);
  });
});
