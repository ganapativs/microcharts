import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { ShiftHistogram } from "./index.js";
import { expectNoA11yViolations } from "../../test/a11y.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);
const MS = (n: number) => `${Math.round(n)} ms`;
const BEFORE = Array.from({ length: 100 }, (_, i) => 120 + (i % 40) - 20);
const AFTER = Array.from({ length: 100 }, (_, i) => 96 + (i % 40) - 20);

describe("<ShiftHistogram>", () => {
  it("summary states the median shift direction — the real string", () => {
    const { container } = draw(
      <ShiftHistogram data={{ before: BEFORE, after: AFTER }} format={MS} />,
    );
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "Median fell from 116 ms to 92 ms.",
    );
  });

  it("no change → 'Median unchanged at'", () => {
    const { container } = draw(
      <ShiftHistogram data={{ before: BEFORE, after: BEFORE }} format={MS} />,
    );
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toContain(
      "Median unchanged at",
    );
  });

  it("unequal n appends a samples clause (proportions keep it honest)", () => {
    const many = Array.from({ length: 250 }, (_, i) => AFTER[i % AFTER.length]!);
    const { container } = draw(
      <ShiftHistogram data={{ before: BEFORE, after: many }} format={MS} />,
    );
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toContain(
      "On 100 / 250 samples",
    );
  });

  it("one side empty → single histogram, 'no after sample'", () => {
    const { container } = draw(<ShiftHistogram data={{ before: BEFORE, after: [] }} format={MS} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toContain("no after sample");
  });

  it("mirrored bars (before up, after down) + center hairline", () => {
    const { container } = draw(
      <ShiftHistogram data={{ before: BEFORE, after: AFTER }} width={160} />,
    );
    expect(container.querySelectorAll('rect[data-mc-ink="neutral"]').length).toBeGreaterThan(2); // before
    expect(container.querySelectorAll('rect[data-mc-ink="accent"]').length).toBeGreaterThan(2); // after
    expect(container.querySelector("line")).not.toBeNull(); // center + medians
  });

  it("every mark paints through an ink role, so forced-colors can remap it", () => {
    const { container } = draw(
      <ShiftHistogram data={{ before: BEFORE, after: AFTER }} width={160} />,
    );
    // An inline fill/stroke or a literal token survives `forced-color-adjust:
    // none` verbatim in High Contrast Mode. Every mark here is role-painted.
    for (const el of container.querySelectorAll("rect, line")) {
      expect(el.getAttribute("data-mc-ink")).not.toBeNull();
      expect(el.getAttribute("stroke")).toBeNull();
      expect(el.getAttribute("style") ?? "").not.toContain("fill:");
    }
    expect(container.querySelector('line[data-mc-ink="muted"]')).not.toBeNull(); // mirror axis
    expect(container.querySelector('line[data-mc-ink="data"]')).not.toBeNull(); // before median
    expect(container.querySelector('line[data-mc-ink="accent"]')).not.toBeNull(); // after median
  });

  it("a caller `color` still owns the after side inline", () => {
    const { container } = draw(
      <ShiftHistogram data={{ before: BEFORE, after: AFTER }} width={160} color="tomato" />,
    );
    expect(container.querySelector('rect[data-mc-ink="accent"]')!.getAttribute("style")).toContain(
      "tomato",
    );
    expect(container.querySelector('line[data-mc-ink="accent"]')!.getAttribute("style")).toContain(
      "tomato",
    );
  });

  it("a non-finite `bins` falls back to auto instead of blanking the plot", () => {
    // Hosts compute this off an empty field (`Number("")` → NaN) or a ratio
    // (→ Infinity). NaN emptied the bin array under a summary that still read
    // the shift; Infinity threw RangeError out of Array.from mid-render.
    for (const bins of [NaN, Infinity, -Infinity]) {
      const { container } = draw(
        <ShiftHistogram data={{ before: BEFORE, after: AFTER }} bins={bins} />,
      );
      expect(container.querySelectorAll("rect").length).toBeGreaterThan(2);
      expect(container.querySelector("svg")!.getAttribute("aria-label")).toContain("Median fell");
    }
  });

  it("the label carries no inline font-variant (styles.css owns tabular-nums)", () => {
    const { container } = draw(
      <ShiftHistogram data={{ before: BEFORE, after: AFTER }} format={MS} width={160} />,
    );
    expect(container.querySelector("text")!.getAttribute("style")).toBeNull();
  });

  it("overlay mode draws the after side as an outline (no down fill)", () => {
    const { container } = draw(
      <ShiftHistogram data={{ before: BEFORE, after: AFTER }} mode="overlay" width={160} />,
    );
    // after outlines are stroked, fill=none
    expect(container.querySelector('rect[fill="none"]')).not.toBeNull();
  });

  it("label='shift' shows the signed shift; 'none' hides it", () => {
    const shift = draw(
      <ShiftHistogram data={{ before: BEFORE, after: AFTER }} format={MS} width={160} />,
    ).container;
    const none = draw(
      <ShiftHistogram data={{ before: BEFORE, after: AFTER }} label="none" width={160} />,
    ).container;
    const shiftTexts = [...shift.querySelectorAll("text")].map((t) => t.textContent);
    expect(shiftTexts).toContain("-24 ms");
    expect([...none.querySelectorAll("text")].map((t) => t.textContent)).not.toContain("-24 ms");
  });

  it("is axe-clean", async () => {
    const { container } = draw(
      <ShiftHistogram data={{ before: BEFORE, after: AFTER }} title="The fix" />,
    );
    await expectNoA11yViolations(container);
  });
});
