import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { describeSeries } from "@microcharts/react";

// accessibility.mdx hand-types the exact `describeSeries` output for known
// inputs (the hero sentence + the degenerate-data table). Those literals are
// the library's actual generated strings — but nothing regenerated them, so a
// change to the generator's wording would rot the page silently. Here we run
// the real generator and assert the page still contains its output, so any
// wording change forces the docs to be updated in the same PR.
const a11y = readFileSync(resolve(process.cwd(), "content/docs/accessibility.mdx"), "utf8");

// Each input is shown verbatim in accessibility.mdx next to its summary.
const INPUTS: readonly (number | null)[][] = [
  [], // "No data."
  [7], // "Single value 7."
  [5, 5, 5, 5], // "Flat at 5."
  [9, 7, 8, 4, 5, 2], // "Trending down 78%. Range 2 to 9. Last value 2."
  [3, 5, 4, 8, 6, 9], // hero: "Trending up 200%. Range 3 to 9. Last value 9."
];

describe("accessibility.mdx quotes real describeSeries output", () => {
  for (const data of INPUTS) {
    const out = describeSeries(data);
    it(`contains the generated summary for ${JSON.stringify(data)} — "${out}"`, () => {
      expect(a11y, `expected accessibility.mdx to quote "${out}"`).toContain(out);
    });
  }
});
