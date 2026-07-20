import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { musicStaffGeometry } from "./geometry.js";

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
});
