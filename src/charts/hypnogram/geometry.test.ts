import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { hypnogramGeometry, hypnoSpans, mergeRuns, firstAppearance } from "./geometry.js";

const SLEEP = [
  { t: 0, state: "Awake" },
  { t: 10, state: "Light" },
  { t: 30, state: "Deep" },
  { t: 50, state: "Light" },
  { t: 60, state: "REM" },
  { t: 80, state: "Light" },
  { t: 90, state: "Awake" },
];

describe("hypnogramGeometry", () => {
  it("merges consecutive same-state entries", () => {
    const merged = mergeRuns(
      [
        { t: 0, state: "a" },
        { t: 1, state: "a" },
        { t: 2, state: "b" },
        { t: 3, state: "b" },
        { t: 4, state: "a" },
      ],
      5,
    );
    expect(merged.map((m) => m.state)).toEqual(["a", "b", "a"]);
  });

  it("first appearance sets the default row order", () => {
    expect(firstAppearance(SLEEP)).toEqual(["Awake", "Light", "Deep", "REM"]);
  });

  it("REFUSES interpolation — step path is H/V only, never a diagonal", () => {
    const geo = hypnogramGeometry({
      data: SLEEP,
      states: ["Awake", "Light", "Deep", "REM"],
      domain: [0, 110],
      width: 120,
      height: 24,
      style: "steps",
    });
    // horizontals use only M and H; connectors only M and V — no L (diagonal)
    expect(geo.path).toMatch(/^[MH\d\s.]*$/);
    expect(geo.connectors).toMatch(/^[MV\d\s.]*$/);
    expect(geo.path).not.toContain("L");
  });

  it("containment: every run inside the viewBox", () => {
    const geo = hypnogramGeometry({
      data: SLEEP,
      states: ["Awake", "Light", "Deep", "REM"],
      domain: [0, 110],
      width: 120,
      height: 24,
      style: "steps",
    });
    for (const r of geo.runs) {
      expect(r.x0).toBeGreaterThanOrEqual(0);
      expect(r.x1).toBeLessThanOrEqual(120.01);
      expect(r.y).toBeGreaterThanOrEqual(0);
      expect(r.y).toBeLessThanOrEqual(24.01);
    }
  });

  it("skips states that only appear at a non-finite t (rows follow runs)", () => {
    expect(
      firstAppearance([
        { t: 0, state: "A" },
        { t: NaN, state: "B" },
      ]),
    ).toEqual(["A"]);
  });

  test.prop([
    fc.array(
      fc.record({ t: fc.integer({ min: 0, max: 1000 }), state: fc.constantFrom("a", "b", "c") }),
      {
        minLength: 1,
        maxLength: 30,
      },
    ),
  ])("runs stay ordered and contained", (data) => {
    const states = firstAppearance(data);
    const geo = hypnogramGeometry({
      data,
      states,
      domain: [0, 1001],
      width: 120,
      height: 24,
      style: "steps",
    });
    for (const r of geo.runs) {
      expect(r.x1).toBeGreaterThanOrEqual(r.x0 - 0.01);
      expect(r.x1).toBeLessThanOrEqual(120.01);
    }
  });
});

describe("hypnoSpans clips to the window", () => {
  it("keeps the state holding at the window start, at the edge", () => {
    // Deep runs 30→50, so at t=20 the night is still Light: that state opens
    // the window rather than being dropped for starting before it.
    expect(hypnoSpans(SLEEP, [20, 60])).toEqual([
      { state: "Light", t0: 20, t1: 30 },
      { state: "Deep", t0: 30, t1: 50 },
      { state: "Light", t0: 50, t1: 60 },
    ]);
  });

  it("a window that predates the data holds nothing", () => {
    expect(hypnoSpans(SLEEP, [-200, -100])).toEqual([]);
  });

  it("a window after the data holds the last state (it runs to domain[1])", () => {
    expect(hypnoSpans(SLEEP, [200, 300])).toEqual([{ state: "Awake", t0: 200, t1: 300 }]);
  });

  it("no run escapes a narrow window — the old span scaled them off the page", () => {
    const geo = hypnogramGeometry({
      data: SLEEP,
      states: ["Awake", "Light", "Deep", "REM"],
      domain: [20, 60],
      width: 140,
      height: 52,
      style: "steps",
    });
    for (const r of geo.runs) {
      expect(r.x0).toBeGreaterThanOrEqual(0);
      expect(r.x1).toBeLessThanOrEqual(140.01);
    }
  });
});

describe("hypnogramGeometry survives an unusable domain", () => {
  // `d1 - d0 || 1` turned each of these into a span of ONE, which either
  // emitted NaN coords or painted thousands of units wide in a 140-unit box.
  const UNUSABLE: [string, [number, number]][] = [
    ["NaN start", [NaN, 110]],
    ["NaN end", [0, NaN]],
    ["infinite end", [0, Infinity]],
    ["infinite both", [-Infinity, Infinity]],
    ["overflowing span", [-1e308, 1e308]],
    ["zero span", [5, 5]],
    ["reversed", [110, 0]],
  ];
  for (const [label, domain] of UNUSABLE) {
    it(`${label} → contained, finite, collapsed to the box centre`, () => {
      const geo = hypnogramGeometry({
        data: SLEEP,
        states: ["Awake", "Light", "Deep", "REM"],
        domain,
        width: 140,
        height: 52,
        style: "steps",
      });
      for (const r of geo.runs) {
        expect(Number.isFinite(r.x0), `x0 of ${r.state}`).toBe(true);
        expect(Number.isFinite(r.x1), `x1 of ${r.state}`).toBe(true);
        expect(r.x0).toBeGreaterThanOrEqual(0);
        expect(r.x1).toBeLessThanOrEqual(140.01);
      }
      expect(geo.path).not.toMatch(/NaN|Infinity/);
      expect(geo.connectors).not.toMatch(/NaN|Infinity/);
    });
  }
});
