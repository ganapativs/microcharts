import { describe, it, expect } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { calendarStripGeometry } from "./geometry.js";

const entries = (pairs: [string, number][]) => new Map(pairs);

const BASE = {
  weeks: 4,
  end: "2026-07-05" as const, // a Sunday
  weekStart: 1 as const,
  steps: 5,
  cell: 7,
  gap: 1,
};

describe("calendarStripGeometry", () => {
  it("builds a weeks × 7 integer grid ending at `end`", () => {
    const geo = calendarStripGeometry({ ...BASE, entries: entries([]) })!;
    expect(geo.cells.length).toBe(28);
    expect(geo.rows).toBe(4);
    expect(geo.width).toBe(7 * 7 + 6);
    expect(geo.height).toBe(4 * 7 + 3);
    expect(geo.cells.at(-1)!.date).toBe("2026-07-05"); // Sunday closes a Mon-start week
    expect(geo.cells[0]!.date).toBe("2026-06-08");
  });

  it("distinguishes value / zero / empty / future states", () => {
    const geo = calendarStripGeometry({
      ...BASE,
      end: "2026-07-01", // Wednesday — the final week row has future cells
      entries: entries([
        ["2026-07-01", 12],
        ["2026-06-30", 0],
      ]),
    })!;
    const by = new Map(geo.cells.map((c) => [c.date, c]));
    expect(by.get("2026-07-01")!.state).toBe("value");
    expect(by.get("2026-07-01")!.step).toBeGreaterThanOrEqual(1);
    expect(by.get("2026-06-30")!.state).toBe("zero");
    expect(by.get("2026-06-30")!.step).toBeNull();
    expect(by.get("2026-06-29")!.state).toBe("empty");
    expect(by.get("2026-07-02")!.state).toBe("future");
    expect(geo.totalDays).toBe(24); // 28 cells − 4 future days (Thu–Sun)
    expect(geo.activeDays).toBe(1);
  });

  it("dates outside the window are ignored silently", () => {
    const geo = calendarStripGeometry({
      ...BASE,
      entries: entries([
        ["2020-01-01", 99],
        ["2030-01-01", 99],
      ]),
    })!;
    expect(geo.activeDays).toBe(0);
  });

  it("weekStart=0 shifts the columns", () => {
    const mon = calendarStripGeometry({ ...BASE, entries: entries([]) })!;
    const sun = calendarStripGeometry({ ...BASE, weekStart: 0, entries: entries([]) })!;
    expect(mon.cells[0]!.date).not.toBe(sun.cells[0]!.date);
    expect(sun.cells[0]!.date).toBe("2026-06-14"); // Sunday end opens its own week row
  });

  it("weeks=1 → single row", () => {
    const geo = calendarStripGeometry({ ...BASE, weeks: 1, entries: entries([]) })!;
    expect(geo.rows).toBe(1);
    expect(geo.cells.length).toBe(7);
  });

  it("unparseable end → null", () => {
    expect(calendarStripGeometry({ ...BASE, end: "not-a-date", entries: entries([]) })).toBeNull();
  });

  it("max value lands on the top step; smallest positive stays ≥ 1", () => {
    const geo = calendarStripGeometry({
      ...BASE,
      entries: entries([
        ["2026-07-04", 100],
        ["2026-07-03", 0.1],
      ]),
    })!;
    const by = new Map(geo.cells.map((c) => [c.date, c]));
    expect(by.get("2026-07-04")!.step).toBe(4);
    expect(by.get("2026-07-03")!.step).toBe(1);
  });

  test.prop([
    fc.integer({ min: 1, max: 8 }),
    fc.constantFrom<0 | 1>(0, 1),
    fc.array(
      fc.tuple(fc.integer({ min: 0, max: 27 }), fc.double({ min: 0, max: 1e6, noNaN: true })),
      { maxLength: 40 },
    ),
  ])("containment: every rendered cell stays inside the viewBox", (weeks, weekStart, raw) => {
    const day = (i: number) => `2026-06-${String(1 + (i % 27)).padStart(2, "0")}`;
    const geo = calendarStripGeometry({
      weeks,
      end: "2026-06-28",
      weekStart,
      entries: new Map(raw.map(([i, v]) => [day(i), v])),
      steps: 5,
      cell: 7,
      gap: 1,
    })!;
    for (const c of geo.cells) {
      expect(c.x).toBeGreaterThanOrEqual(0);
      expect(c.y).toBeGreaterThanOrEqual(0);
      expect(c.x + c.size).toBeLessThanOrEqual(geo.width);
      expect(c.y + c.size).toBeLessThanOrEqual(geo.height);
      if (c.step !== null) {
        expect(c.step).toBeGreaterThanOrEqual(1);
        expect(c.step).toBeLessThanOrEqual(4);
      }
    }
  });

  test.prop([fc.constantFrom("2026-01-04", "2026-03-29", "2026-10-25", "2026-12-31")])(
    "TZ-invariance is inherited from core/calendar (DST boundary ends)",
    (end) => {
      const a = calendarStripGeometry({ ...BASE, end, entries: entries([[end, 5]]) })!;
      expect(a.cells.some((c) => c.date === end && c.state === "value")).toBe(true);
    },
  );
});
