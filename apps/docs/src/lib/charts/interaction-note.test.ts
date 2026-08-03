import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { CHARTS } from "./entries";
import {
  interactionKind,
  interactionNote,
  INTERACTION_NOTES,
  REVEAL_NOTE,
} from "./interaction-note";
import { expandComponents } from "../md-transform";

const mdx = (slug: string) =>
  readFileSync(resolve(process.cwd(), `content/docs/charts/${slug}.mdx`), "utf8");
const resolveChart = (slug: string) => CHARTS.find((c) => c.slug === slug);

// The per-chart interaction sentence is generated from the registry, in one
// place, and mounted by one tag. These guard both halves: the tag is on every
// page, and the wording it resolves to is TRUE for that chart.
describe("interaction note", () => {
  it("every chart page mounts the note exactly once, in its Accessibility section", () => {
    for (const chart of CHARTS) {
      const src = mdx(chart.slug);
      const tag = `<InteractionNote slug="${chart.slug}" />`;
      expect(src.split(tag).length - 1, chart.slug).toBe(1);
      const a11y = src.indexOf("\n## Accessibility");
      const props = src.indexOf("\n## Props");
      const at = src.indexOf(tag);
      expect(at, chart.slug).toBeGreaterThan(a11y);
      expect(at, chart.slug).toBeLessThan(props);
    }
  });

  it("every chart has an interactive twin", () => {
    expect(CHARTS.filter((c) => !c.interactiveImport)).toEqual([]);
  });

  it("the two contract exceptions get no generated sentence", () => {
    // MinimapStrip is a slider; TokenConfidence moves real focus into the text.
    // Neither the picker nor the single-unit wording is true for them.
    for (const slug of ["minimap-strip", "token-confidence"]) {
      const entry = CHARTS.find((c) => c.slug === slug)!;
      expect(entry.picker, slug).toBe(false);
      expect(interactionKind(entry), slug).toBe("none");
    }
  });

  it("picker charts get the roving/pin wording, lean scalars do not", () => {
    const picker = CHARTS.filter((c) => interactionKind(c) === "picker");
    const single = CHARTS.filter((c) => interactionKind(c) === "single");
    expect(picker.length + single.length).toBe(CHARTS.length - 2);
    // Lean scalars must deny roving and pinned state, never promise them.
    expect(INTERACTION_NOTES.single).not.toMatch(/arrow|Home|End/);
    expect(INTERACTION_NOTES.single).toMatch(/nothing to rove between/);
    expect(INTERACTION_NOTES.single).toMatch(/no selection stays pinned/);
    expect(INTERACTION_NOTES.picker).toMatch(/arrow keys rove/);
    expect(picker.every((c) => c.picker !== false)).toBe(true);
    expect(single.every((c) => c.picker === false)).toBe(true);
  });

  // A scalar's note promises a hover chip only where the chart paints one, and
  // the registry flag that decides it must match the library. The six exempt
  // charts are the ones whose glyph already prints (or is) the number.
  it("the hover-reveal clause tracks the registry's `readout` flag", () => {
    const quiet = CHARTS.filter((c) => c.readout === false).map((c) => c.slug);
    expect(quiet.sort()).toEqual(
      ["delta", "dice-pips", "fat-digits", "status-dot", "tally-marks", "trend-arrow"].sort(),
    );
    for (const chart of CHARTS.filter((c) => interactionKind(c) === "single")) {
      const note = interactionNote(chart)!;
      expect(note.includes(REVEAL_NOTE), chart.slug).toBe(chart.readout !== false);
    }
    // Picker charts never repeat it — their own sentence covers the readout.
    for (const chart of CHARTS.filter((c) => interactionKind(c) === "picker")) {
      expect(interactionNote(chart), chart.slug).not.toContain(REVEAL_NOTE);
    }
  });

  it("the Markdown mirrors carry the same sentence the page renders", () => {
    const expand = (slug: string) => expandComponents(mdx(slug), resolveChart);
    expect(expand("sparkline")).toContain("arrow keys rove between units on both axes");
    expect(expand("delta")).toContain("This chart is a single unit");
    for (const slug of ["minimap-strip", "token-confidence"]) {
      expect(expand(slug), slug).not.toContain("interaction contract");
      expect(expand(slug), slug).not.toContain("<InteractionNote");
    }
    expect(expand("wind-barb")).toContain("This chart is a single unit");
  });
});
