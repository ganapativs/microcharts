import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { musicStaffFrame, musicStaffGeometry } from "./geometry.js";

const g = (values: (number | null)[], mode: "staff" | "ledger" = "ledger") =>
  musicStaffGeometry({ values, width: 60, height: 20, mode, pad: 2 });

describe("musicStaffGeometry — pitch on a staff", () => {
  it("always draws five staff lines", () => {
    expect(g([1, 2, 3]).staffYs.length).toBe(5);
  });

  it("higher value → higher pitch (smaller y)", () => {
    const geo = g([3, 9]);
    const lowNote = geo.notes.find((n) => n.value === 3)!;
    const highNote = geo.notes.find((n) => n.value === 9)!;
    expect(highNote.cy).toBeLessThan(lowNote.cy);
  });

  it("one note per finite value; null is a rest (no note)", () => {
    const geo = g([3, null, 9]);
    expect(geo.notes.length).toBe(2);
    expect(geo.notes.map((n) => n.index)).toEqual([0, 2]);
  });

  it("coincident equal values keep pitch, spread along time", () => {
    const geo = g([5, 5, 5]);
    expect(new Set(geo.notes.map((n) => n.cy)).size).toBe(1); // same pitch
    expect(new Set(geo.notes.map((n) => n.cx)).size).toBe(3); // distinct times
  });

  it("ledger mode has 13 positions; staff mode clamps to 9", () => {
    // extreme spread → the min/max land at the outermost positions
    const led = g([0, 100]);
    const stf = g([0, 100], "staff");
    // ledger top position (0) sits above the staff top line; staff top is line 0
    expect(led.notes.find((n) => n.value === 100)!.cy).toBeLessThan(led.staffYs[0]!);
    expect(stf.notes.find((n) => n.value === 100)!.cy).toBe(stf.staffYs[0]!);
  });

  it("off-staff notes get a ledger tick", () => {
    const geo = g([0, 100]); // 100 → above the staff
    expect(geo.ledger.length).toBeGreaterThan(0);
  });

  test.prop([fc.array(fc.integer({ min: 0, max: 100 }), { minLength: 1, maxLength: 16 })])(
    "notes stay inside the box",
    (values) => {
      const geo = musicStaffGeometry({ values, width: 60, height: 20, mode: "ledger", pad: 2 });
      for (const n of geo.notes) {
        expect(n.cy - n.ry).toBeGreaterThanOrEqual(-0.5);
        expect(n.cy + n.ry).toBeLessThanOrEqual(20.5);
      }
    },
  );

  it("note heads never take a negative radius, however short the box", () => {
    // rx="-0.27" is an SVG error: the note isn't drawn small, it isn't drawn.
    for (const height of [0, 1, 3, 4]) {
      const geo = musicStaffGeometry({ values: [1, 9], width: 60, height, mode: "ledger", pad: 2 });
      for (const n of geo.notes) {
        expect(n.rx).toBeGreaterThanOrEqual(0);
        expect(n.ry).toBeGreaterThanOrEqual(0);
        expect(n.cy).toBeGreaterThanOrEqual(0);
        expect(n.cy).toBeLessThanOrEqual(Math.max(height, 2));
      }
    }
  });

  test.prop([
    fc.array(fc.integer({ min: 0, max: 100 }), { minLength: 2, maxLength: 12 }),
    fc.integer({ min: 4, max: 40 }),
  ])("ledger ticks stay inside the box at any height", (values, height) => {
    const geo = musicStaffGeometry({ values, width: 60, height, mode: "ledger", pad: 2 });
    for (const l of geo.ledger) {
      expect(l.x1).toBeGreaterThanOrEqual(0);
      expect(l.x2).toBeLessThanOrEqual(60);
    }
  });

  it("the ledger tick keeps its engraved width at the default box", () => {
    // The tick is now sized from the note head; 2.2 either side is what that
    // works out to at 28 units tall, so the shipped look is unchanged.
    const opts = { values: [0, 100], width: 60, height: 28, mode: "ledger", pad: 2 } as const;
    const [first] = musicStaffGeometry(opts).ledger;
    expect(first!.x2 - first!.x1).toBeCloseTo(4.4, 2);
  });
});

const frame = musicStaffFrame;

describe("musicStaffFrame — the box + label metrics both entries read", () => {
  it("falls back to the documented box for a non-finite or non-positive size", () => {
    for (const bad of [NaN, Infinity, -Infinity, 0, -50]) {
      const f = frame({ width: bad, height: bad });
      expect(f.width).toBe(60);
      expect(f.height).toBe(28);
    }
  });

  it("falls back to labelFont for a non-finite or non-positive fontSize", () => {
    for (const bad of [NaN, Infinity, 0, -5]) {
      expect(frame({ width: 60, height: 28, fontSize: bad }).fontSize).toBe(11);
    }
    expect(frame({ width: 60, height: 28, fontSize: 8 }).fontSize).toBe(8);
  });

  it("reserves the gutter the figure needs when it fits", () => {
    expect(frame({ width: 60, height: 28, labelText: "9" }).gutter).toBe(9);
    expect(frame({ width: 60, height: 28, labelText: "0.99" }).gutter).toBe(30);
    expect(frame({ width: 60, height: 28 }).gutter).toBe(0);
  });

  it("drops a figure that would leave no staff, keeps it when the box is wide", () => {
    // `-999,999,999` wanted 84 units of a 60-unit box: the staff's right edge
    // landed at x -26 — outside the viewBox — and both notes collapsed onto one
    // x, which drops the time axis. The same figure fits a 160-wide box.
    expect(frame({ width: 60, height: 28, labelText: "-999,999,999" }).gutter).toBe(0);
    expect(frame({ width: 160, height: 28, labelText: "-999,999,999" }).gutter).toBe(84);
    // `$250,000` would have left a 10-unit staff: contained, but no longer a staff.
    expect(frame({ width: 60, height: 28, labelText: "250,000" }).gutter).toBe(0);
    // a narrow box still gets its short figure — the floor is a share there
    expect(frame({ width: 20, height: 28, labelText: "3" }).gutter).toBe(9);
  });

  it("drops a figure the box is too short to seat", () => {
    expect(frame({ width: 60, height: 6, labelText: "9" }).gutter).toBe(0);
    expect(frame({ width: 60, height: 8, labelText: "9" }).gutter).toBeGreaterThan(0);
  });
});
