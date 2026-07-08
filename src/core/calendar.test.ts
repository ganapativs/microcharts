import { describe, it, expect } from "vitest";
import { test, fc } from "@fast-check/vitest";
import {
  parseUTCDay,
  isoDate,
  weekGrid,
  dayOfYear,
  daysInYear,
  monthStartDays,
} from "./calendar.js";

// arbitrary UTC day in a wide window (1990–2090)
const utcDay = fc
  .integer({ min: Date.UTC(1990, 0, 1) / 86_400_000, max: Date.UTC(2090, 11, 31) / 86_400_000 })
  .map((d) => d * 86_400_000);

describe("parseUTCDay / isoDate", () => {
  it("ISO string → UTC midnight", () => {
    expect(parseUTCDay("2026-07-08")).toBe(Date.UTC(2026, 6, 8));
  });

  it("time suffix dropped — the day is the unit", () => {
    expect(parseUTCDay("2026-07-08T23:59:59Z")).toBe(Date.UTC(2026, 6, 8));
  });

  it("Date input uses its UTC calendar day, whatever the local TZ", () => {
    // 2026-07-08T23:30 UTC is already July 9 in TZs east of UTC+0:30 —
    // the UTC day must win everywhere
    expect(parseUTCDay(new Date(Date.UTC(2026, 6, 8, 23, 30)))).toBe(Date.UTC(2026, 6, 8));
  });

  it("invalid input → null, never a throw", () => {
    expect(parseUTCDay("not a date")).toBeNull();
    expect(parseUTCDay("2026-7-8")).toBeNull(); // not zero-padded ISO
    expect(parseUTCDay("2026-02-31")).toBeNull(); // rollover rejected
    expect(parseUTCDay(new Date(NaN))).toBeNull();
  });

  test.prop([utcDay])("isoDate round-trips through parseUTCDay", (t) => {
    expect(parseUTCDay(isoDate(t))).toBe(t);
  });
});

describe("weekGrid (edge matrix)", () => {
  it("invalid end → null", () => {
    expect(weekGrid({ end: "nope", weeks: 4 })).toBeNull();
  });

  it("weeks clamped to ≥ 1", () => {
    expect(weekGrid({ end: "2026-07-08", weeks: 0 })!.rows).toBe(1);
    expect(weekGrid({ end: "2026-07-08", weeks: -3 })!.rows).toBe(1);
  });

  it("Monday start (default): 2026-07-08 is a Wednesday → col 2", () => {
    const g = weekGrid({ end: "2026-07-08", weeks: 1 })!;
    expect(g.days).toHaveLength(7);
    expect(g.days[0]!.date).toBe("2026-07-06"); // Monday
    expect(g.days[2]!.date).toBe("2026-07-08");
    expect(g.days[6]!.date).toBe("2026-07-12"); // Sunday completes the row
    expect(g.end).toBe("2026-07-08");
  });

  it("Sunday start shifts the columns", () => {
    const g = weekGrid({ end: "2026-07-08", weeks: 1, weekStart: 0 })!;
    expect(g.days[0]!.date).toBe("2026-07-05"); // Sunday
    expect(g.days[3]!.date).toBe("2026-07-08");
  });

  it("end already on the week start → full row behind it", () => {
    const g = weekGrid({ end: "2026-07-06", weeks: 1 })!; // a Monday
    expect(g.days[0]!.date).toBe("2026-07-06");
    expect(g.days[0]!.col).toBe(0);
  });

  it("cells after end exist to complete the final row (future days)", () => {
    const g = weekGrid({ end: "2026-07-08", weeks: 1 })!;
    const future = g.days.filter((d) => d.time > g.endTime);
    expect(future).toHaveLength(4); // Thu–Sun
  });

  it("crosses month and year boundaries with real calendar days", () => {
    const g = weekGrid({ end: "2026-01-02", weeks: 2 })!;
    expect(g.days[0]!.date).toBe("2025-12-22");
    expect(g.days.some((d) => d.month === 11)).toBe(true);
    expect(g.days.some((d) => d.month === 0)).toBe(true);
  });
});

describe("weekGrid (invariants + TZ invariance)", () => {
  test.prop([utcDay, fc.integer({ min: 1, max: 60 }), fc.constantFrom(0 as const, 1 as const)])(
    "rows × 7 consecutive days; row/col walk the grid; end is in the last row",
    (t, weeks, weekStart) => {
      const g = weekGrid({ end: isoDate(t), weeks, weekStart })!;
      expect(g.days).toHaveLength(weeks * 7);
      for (let i = 0; i < g.days.length; i++) {
        const d = g.days[i]!;
        expect(d.row).toBe(Math.floor(i / 7));
        expect(d.col).toBe(i % 7);
        if (i > 0) expect(d.time - g.days[i - 1]!.time).toBe(86_400_000);
        // column 0 is the locale week start
        if (d.col === 0) expect(d.weekday).toBe(weekStart);
      }
      const endCell = g.days.find((d) => d.time === g.endTime)!;
      expect(endCell.row).toBe(weeks - 1);
    },
  );

  test.prop([utcDay, fc.integer({ min: 1, max: 12 })])(
    "same day → same grid, string or Date input (pure UTC, no local-TZ leak)",
    (t, weeks) => {
      // three spellings of the same UTC day: ISO string, exact UTC Date, and a
      // late-evening timestamp that is "tomorrow" in eastern local timezones
      const iso = weekGrid({ end: isoDate(t), weeks })!;
      const exact = weekGrid({ end: new Date(t), weeks })!;
      const evening = weekGrid({ end: new Date(t + 23.5 * 3_600_000), weeks })!;
      expect(exact).toEqual(iso);
      expect(evening).toEqual(iso);
    },
  );
});

describe("dayOfYear / daysInYear / monthStartDays", () => {
  it("Jan 1 → 1, Dec 31 → 365/366", () => {
    expect(dayOfYear("2026-01-01")).toBe(1);
    expect(dayOfYear("2026-12-31")).toBe(365);
    expect(dayOfYear("2024-12-31")).toBe(366); // leap
  });

  it("invalid → null", () => expect(dayOfYear("nope")).toBeNull());

  it("daysInYear handles the century rules", () => {
    expect(daysInYear(2024)).toBe(366);
    expect(daysInYear(2026)).toBe(365);
    expect(daysInYear(1900)).toBe(365);
    expect(daysInYear(2000)).toBe(366);
  });

  it("month starts, non-leap and leap", () => {
    expect(monthStartDays(2026)).toEqual([1, 32, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335]);
    expect(monthStartDays(2024)[2]).toBe(61); // March slides in a leap year
  });

  test.prop([fc.integer({ min: 1990, max: 2090 })])(
    "12 ascending starts within the year; last month leaves 31 days",
    (year) => {
      const starts = monthStartDays(year);
      expect(starts).toHaveLength(12);
      expect(starts[0]).toBe(1);
      for (let m = 1; m < 12; m++) expect(starts[m]!).toBeGreaterThan(starts[m - 1]!);
      expect(daysInYear(year) - starts[11]! + 1).toBe(31); // December
    },
  );

  test.prop([utcDay])("dayOfYear is within [1, daysInYear]", (t) => {
    const doy = dayOfYear(isoDate(t))!;
    const year = Number(isoDate(t).slice(0, 4));
    expect(doy).toBeGreaterThanOrEqual(1);
    expect(doy).toBeLessThanOrEqual(daysInYear(year));
  });
});
