// Geometry owns the plot box; a component never re-derives its padding.
//
// The inline seat turns a plot box into `--mc-seat`, so the number a component
// hands `<Chart seat={...}>` has to be the same number the geometry laid the
// marks out against. When it is spelled as a literal in the component instead,
// the two are only equal by coincidence: `city-skyline` computed its ground line
// in BOTH entries, the client one with `2` where the component used `PAD`, so
// changing the pad would have moved the buildings and left the focus rings
// behind. Six charts spelled `height - 2` in their no-data branch, duplicating a
// `pad = opts.pad ?? 2` default that lives in the geometry.
//
// The rule this asserts: inside a `seat={{...}}`, a number is either the box
// itself (`0`, `height`, `size`) or a NAMED thing — `geo.y1`, an imported
// `*_PAD` constant, a local derived from one. A bare pad literal is the defect.
// Division by a literal is fine: `midY - barH / 2` is a midpoint, not a pad.
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const chartsDir = resolve(import.meta.dirname, "../charts");

/** Literals that are the box or a shape, never a padding inset. */
function padLiterals(seatExpr: string): string[] {
  // Drop divisors (`/ 2`) — those halve a span, they don't inset a box.
  const withoutDivisors = seatExpr.replace(/\/\s*\d+(?:\.\d+)?/g, "");
  return [...withoutDivisors.matchAll(/(?<![\w.])(\d+(?:\.\d+)?)(?![\w.])/g)]
    .map((m) => m[1]!)
    .filter((n) => Number(n) !== 0);
}

describe("inline seat reads the geometry-owned box", () => {
  const charts = readdirSync(chartsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  it("finds the catalog", () => {
    expect(charts.length).toBeGreaterThan(100);
  });

  it("no seat spells a padding inset as a bare literal", () => {
    const offenders: string[] = [];
    for (const chart of charts) {
      for (const entry of ["index.tsx", "client.tsx"]) {
        const path = resolve(chartsDir, chart, entry);
        let src: string;
        try {
          src = readFileSync(path, "utf8");
        } catch {
          continue;
        }
        for (const m of src.matchAll(/seat=\{\{[^}]*\}\}/g)) {
          const nums = padLiterals(m[0]);
          if (nums.length > 0) {
            const line = src.slice(0, m.index).split("\n").length;
            offenders.push(
              `${chart}/${entry}:${line} seats on the literal(s) ${nums.join(", ")} — ` +
                `read the box from geometry (geo.y0/geo.y1) or an exported constant instead: ${m[0].replace(/\s+/g, " ")}`,
            );
          }
        }
      }
    }
    expect(offenders, offenders.join("\n")).toEqual([]);
  });
});
