import { describe, it, expect } from "vitest";
import { test, fc } from "@fast-check/vitest";
import { streakSparkGeometry, MAX_RUNS, type StreakDatum } from "./geometry.js";

const W = 96;
const H = 20;
const geo = (data: readonly StreakDatum[], opts = {}) =>
  streakSparkGeometry(data, { width: W, height: H, ...opts });

describe("streakSparkGeometry (edge matrix, plan/09)", () => {
  it("empty → no runs", () => {
    expect(geo([]).runs).toEqual([]);
  });

  it("all-null → no runs", () => {
    const g = geo([null, null, null]);
    expect(g.runs).toEqual([]);
    expect(g.currentLen).toBe(0);
  });

  it("collapses consecutive equal outcomes into one run", () => {
    const g = geo([true, true, true, false, false, true]);
    expect(g.runs.map((r) => [r.on, r.len])).toEqual([
      [true, 3],
      [false, 2],
      [true, 1],
    ]);
  });

  it("a gap (null) breaks a run even when the outcome resumes", () => {
    const g = geo([true, true, null, true, true]);
    expect(g.runs.map((r) => r.len)).toEqual([2, 2]);
    expect(g.runs.every((r) => r.on)).toBe(true);
  });

  it("NaN / ±Infinity behave as gaps", () => {
    const g = geo([1, Number.NaN, 1, Number.POSITIVE_INFINITY, 1]);
    expect(g.runs.map((r) => r.len)).toEqual([1, 1, 1]);
  });

  it("current run is the last run; record is the longest ok run", () => {
    const g = geo([true, true, true, true, false, true, true]);
    const current = g.runs.at(-1)!;
    expect(current.current).toBe(true);
    expect(current.len).toBe(2);
    expect(g.recordLen).toBe(4);
    expect(g.runs.find((r) => r.record)!.len).toBe(4);
    expect(g.breaks).toBe(1);
  });

  it("numeric data passes on v > 0; threshold overrides", () => {
    expect(geo([3, 0, 5]).runs.map((r) => r.on)).toEqual([true, false, true]);
    expect(geo([3, 7, 5], { threshold: 5 }).runs.map((r) => r.on)).toEqual([false, true]);
  });

  it("positive:'down' inverts which outcome is the streak", () => {
    const up = geo([false, false, false]);
    const down = geo([false, false, false], { positive: "down" });
    expect(up.runs[0]!.on).toBe(false); // fails are breaks
    expect(down.runs[0]!.on).toBe(true); // fails are now the streak
    expect(down.recordLen).toBe(3);
  });

  it("all-pass → one unbroken run that is both current and record", () => {
    const g = geo([true, true, true, true]);
    expect(g.runs).toHaveLength(1);
    expect(g.runs[0]!.current && g.runs[0]!.record).toBe(true);
    expect(g.breaks).toBe(0);
    expect(g.recordLen).toBe(4);
  });

  it("all-fail → one break run, no record", () => {
    const g = geo([false, false, false]);
    expect(g.runs).toHaveLength(1);
    expect(g.breaks).toBe(1);
    expect(g.recordLen).toBe(0);
    expect(g.currentOn).toBe(false);
  });

  it("single trial → one current run of length 1", () => {
    const g = geo([true]);
    expect(g.runs).toHaveLength(1);
    expect(g.currentLen).toBe(1);
  });

  it("runs tile the plot, widest run = longest run", () => {
    const g = geo([true, true, true, true, true, false, true]);
    const okRun = g.runs.find((r) => r.on && r.len === 5)!;
    const shortRun = g.runs.find((r) => r.len === 1)!;
    expect(okRun.width).toBeGreaterThan(shortRun.width);
  });

  it("caps runs, merging the oldest into an ellipsis slot", () => {
    const many: StreakDatum[] = [];
    for (let i = 0; i < 60; i++) many.push(i % 2 === 0, null); // 60 alternating runs
    const g = geo(many);
    expect(g.runs.length).toBeLessThanOrEqual(MAX_RUNS);
    expect(g.truncated).toBe(true);
    expect(g.ellipsis).not.toBeNull();
  });
});

const datum = fc.oneof(
  fc.boolean(),
  fc.constant(null as StreakDatum),
  fc.integer({ min: -3, max: 3 }),
);

describe("streakSparkGeometry (invariants)", () => {
  test.prop([fc.array(datum, { minLength: 1 }), fc.integer({ min: 8, max: 200 })])(
    "runs stay within the box, no NaN",
    (data, w) => {
      const g = streakSparkGeometry(data, { width: w, height: H });
      for (const r of g.runs) {
        expect(Number.isNaN(r.x + r.y + r.width + r.height)).toBe(false);
        expect(r.x).toBeGreaterThanOrEqual(1 - 1e-6);
        expect(r.x + r.width).toBeLessThanOrEqual(w - 1 + 1e-6);
        expect(r.y).toBeGreaterThanOrEqual(1 - 1e-6);
        expect(r.y + r.height).toBeLessThanOrEqual(H - 1 + 1e-6);
        expect(r.width).toBeGreaterThan(0);
        expect(r.height).toBeGreaterThan(0);
      }
      if (g.ellipsis) {
        expect(g.ellipsis.x).toBeGreaterThanOrEqual(1 - 1e-6);
        expect(g.ellipsis.x + g.ellipsis.width).toBeLessThanOrEqual(w - 1 + 1e-6);
      }
    },
  );
});
