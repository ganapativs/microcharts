import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { ensembleGeometry, selectGhosts } from "./geometry.js";

const base = { width: 80, height: 20 };
// 24 members: constant lines at 31..54 (endpoints span that range)
const ENS = Array.from({ length: 24 }, (_, i) => [31 + i, 31 + i, 31 + i]);

describe("selectGhosts — deterministic", () => {
  it("same input → same ghosts, every call", () => {
    const a = selectGhosts(ENS, 8);
    const b = selectGhosts(ENS, 8);
    expect(a).toEqual(b);
  });

  it("picks evenly spaced endpoint quantiles (lowest + highest included)", () => {
    const pick = selectGhosts(ENS, 5);
    // endpoints sorted asc → member 0 (lowest) and member 23 (highest) are ends
    expect(pick).toContain(0);
    expect(pick).toContain(23);
  });

  it("ghosts ≥ members → all members, selection skipped", () => {
    const pick = selectGhosts(ENS, 50);
    expect(pick.length).toBe(24);
  });
});

describe("ensembleGeometry", () => {
  it("renders up to `ghosts` faint paths + one emphasis", () => {
    const geo = ensembleGeometry({ ...base, data: ENS, ghosts: 8 })!;
    expect(geo.ghostPaths.length).toBeLessThanOrEqual(8);
    expect(geo.ghostPaths.length).toBeGreaterThan(0);
    expect(geo.emphasisPath.d).toContain("M");
  });

  it("spread is the endpoint range across ALL members (not just ghosts)", () => {
    const geo = ensembleGeometry({ ...base, data: ENS, ghosts: 4 })!;
    expect(geo.spread.lastLo).toBe(31);
    expect(geo.spread.lastHi).toBe(54);
  });

  it("nearest-median emphasis is a real member near the pointwise median", () => {
    const geo = ensembleGeometry({ ...base, data: ENS, emphasis: "nearest-median" })!;
    expect(geo.emphasisPath.member).not.toBeNull();
    expect(geo.typicalEnd).toBe(42); // median of 31..54 ≈ 42.5 → member 42 (first)
  });

  it("median emphasis is synthetic (member null)", () => {
    const geo = ensembleGeometry({ ...base, data: ENS, emphasis: "median" })!;
    expect(geo.emphasisPath.member).toBeNull();
  });

  it("a pinned emphasis index draws that member", () => {
    const geo = ensembleGeometry({ ...base, data: ENS, emphasis: 5 })!;
    expect(geo.emphasisPath.member).toBe(5);
  });

  it("members of unequal length each drawn to their own length", () => {
    const data = [
      [10, 20, 30, 40],
      [12, 22],
      [8, 18, 28],
    ];
    const geo = ensembleGeometry({ ...base, data, ghosts: 3 })!;
    expect(geo.memberCount).toBe(3);
    // the 4-point member reaches the right edge; the 2-point one does not
    expect(geo.ghostPaths.length).toBe(3);
  });

  it("members with NaN are excluded", () => {
    const data = [
      [10, 20, 30],
      [5, NaN, 25],
      [8, 18, 28],
    ];
    const geo = ensembleGeometry({ ...base, data })!;
    expect(geo.memberCount).toBe(2); // the NaN member dropped
  });

  it("single member → memberCount 1 (docs steer to Sparkline)", () => {
    const geo = ensembleGeometry({ ...base, data: [[10, 20, 30]] })!;
    expect(geo.memberCount).toBe(1);
  });

  it("a non-finite ghosts count falls back to the documented default, not zero ghosts", () => {
    // `Number("")` → NaN survived Math.round/min/max, so `k = NaN` selected no
    // members at all: an empty frame under a summary announcing 24 paths.
    const nan = ensembleGeometry({ ...base, data: ENS, ghosts: Number.NaN })!;
    expect(nan.ghostPaths.map((g) => g.member)).toEqual(
      ensembleGeometry({ ...base, data: ENS, ghosts: 8 })!.ghostPaths.map((g) => g.member),
    );
    // ±Infinity still clamps to the documented 1..12 window
    expect(
      ensembleGeometry({ ...base, data: ENS, ghosts: Number.POSITIVE_INFINITY })!.ghostPaths.length,
    ).toBe(12);
    expect(
      ensembleGeometry({ ...base, data: ENS, ghosts: Number.NEGATIVE_INFINITY })!.ghostPaths.length,
    ).toBe(1);
  });

  it("a non-finite domain falls back to the data extent — never NaN coordinates", () => {
    const clean = ensembleGeometry({ ...base, data: ENS })!;
    for (const domain of [
      [Number.NaN, Number.NaN],
      [Number.NaN, 60],
      [0, Number.NaN],
      [Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY],
    ] as const) {
      const geo = ensembleGeometry({ ...base, data: ENS, domain })!;
      expect(geo.domain).toEqual(clean.domain);
      expect(geo.emphasisPath.d).toBe(clean.emphasisPath.d);
      expect(geo.emphasisPath.d).not.toMatch(/NaN|Infinity/);
    }
  });

  it("a finite explicit domain is still honoured", () => {
    const geo = ensembleGeometry({ ...base, data: ENS, domain: [0, 100] })!;
    expect(geo.domain).toEqual([0, 100]);
    expect(geo.yFor(0)).toBe(18);
  });

  it("all-invalid / empty → null", () => {
    expect(ensembleGeometry({ ...base, data: [] })).toBeNull();
    expect(ensembleGeometry({ ...base, data: [[NaN, NaN]] })).toBeNull();
  });

  test.prop([
    fc.array(fc.array(fc.integer({ min: 0, max: 100 }), { minLength: 2, maxLength: 12 }), {
      minLength: 1,
      maxLength: 30,
    }),
  ])("ghost paths never exceed the cap; selection deterministic", (data) => {
    const geo = ensembleGeometry({ ...base, data, ghosts: 8 });
    if (geo === null) return;
    expect(geo.ghostPaths.length).toBeLessThanOrEqual(8);
    const again = ensembleGeometry({ ...base, data, ghosts: 8 })!;
    expect(again.ghostPaths.map((g) => g.member)).toEqual(geo.ghostPaths.map((g) => g.member));
  });
});
