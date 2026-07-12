import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { hypnogramGeometry, mergeRuns, firstAppearance } from "./geometry.js";

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
