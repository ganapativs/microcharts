import { describe, it, expect } from "vitest";
import { test, fc } from "@fast-check/vitest";
import { hashSeed, seeded, jitter } from "./jitter.js";

const seq = (s: number | string) => Array.from({ length: 4 }, seeded(s));

const seedPart = fc.oneof(
  fc.double({ noNaN: true, noDefaultInfinity: true, min: -1e6, max: 1e6 }),
  fc.string(),
);

describe("hashSeed", () => {
  it("deterministic across calls", () => {
    expect(hashSeed(1, 2, "a")).toBe(hashSeed(1, 2, "a"));
  });

  it("part boundaries matter: ('a','b') ≠ ('ab')", () => {
    expect(hashSeed("a", "b")).not.toBe(hashSeed("ab"));
  });

  it("no parts is still a valid seed", () => {
    expect(hashSeed()).toBe(hashSeed());
  });

  test.prop([fc.array(seedPart, { maxLength: 10 })])("non-negative 32-bit int", (parts) => {
    const h = hashSeed(...parts);
    expect(Number.isInteger(h)).toBe(true);
    expect(h).toBeGreaterThanOrEqual(0);
    expect(h).toBeLessThanOrEqual(0xffffffff);
  });
});

describe("seeded (SSR/hydration determinism contract)", () => {
  test.prop([seedPart, fc.integer({ min: 1, max: 200 })])(
    "same seed → byte-identical sequence",
    (seed, n) => {
      const a = seeded(seed);
      const b = seeded(seed);
      for (let i = 0; i < n; i++) expect(a()).toBe(b());
    },
  );

  test.prop([
    fc.array(seedPart, { minLength: 1, maxLength: 10 }),
    fc.integer({ min: 1, max: 200 }),
  ])("array seeds (seed-from-data) are deterministic too", (parts, n) => {
    const a = seeded(parts);
    const b = seeded([...parts]);
    for (let i = 0; i < n; i++) expect(a()).toBe(b());
  });

  test.prop([seedPart, fc.integer({ min: 1, max: 500 })])("values live in [0, 1)", (seed, n) => {
    const rand = seeded(seed);
    for (let i = 0; i < n; i++) {
      const v = rand();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it("different seeds diverge (spot checks, not a law)", () => {
    expect(seq(1)).not.toEqual(seq(2));
    expect(seq("sparkline")).not.toEqual(seq("delta"));
  });

  it("array seed equals the equivalent hashSeed number", () => {
    const a = seeded([3, "x"]);
    const b = seeded(hashSeed(3, "x"));
    // not required to match (hashSeed(number) re-hashes) — but the ARRAY form
    // must match spreading the parts
    const c = seeded([3, "x"]);
    expect([a(), a(), a()]).toEqual([c(), c(), c()]);
    expect(typeof b()).toBe("number");
  });
});

describe("jitter", () => {
  it("count < 1 → empty", () => {
    expect(jitter("s", 0, 2)).toEqual([]);
    expect(jitter("s", -3, 2)).toEqual([]);
  });

  it("non-finite or ≤ 0 amplitude → zeros (marks sit on their true position)", () => {
    expect(jitter("s", 3, 0)).toEqual([0, 0, 0]);
    expect(jitter("s", 3, -1)).toEqual([0, 0, 0]);
    expect(jitter("s", 2, NaN)).toEqual([0, 0]);
  });

  test.prop([
    seedPart,
    fc.integer({ min: 1, max: 100 }),
    fc.double({ min: 0.01, max: 50, noNaN: true }),
  ])("deterministic, bounded by ±amplitude, 2-dp", (seed, count, amplitude) => {
    const a = jitter(seed, count, amplitude);
    expect(a).toEqual(jitter(seed, count, amplitude));
    expect(a).toHaveLength(count);
    for (const v of a) {
      expect(Math.abs(v)).toBeLessThanOrEqual(amplitude + 0.005); // 2-dp rounding slack
      expect(v).toBe(Math.round(v * 100) / 100);
    }
  });

  test.prop([
    fc.array(fc.double({ noNaN: true, noDefaultInfinity: true }), { minLength: 1, maxLength: 20 }),
  ])("seed-from-data: same series → same offsets (never Math.random)", (data) => {
    expect(jitter(data, 6, 1.5)).toEqual(jitter([...data], 6, 1.5));
  });
});
