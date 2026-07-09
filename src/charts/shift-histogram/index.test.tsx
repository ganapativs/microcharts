import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { ShiftHistogram } from "./index.js";
import { expectNoA11yViolations } from "../../test/a11y.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);
const MS = (n: number) => `${Math.round(n)} ms`;
const BEFORE = Array.from({ length: 100 }, (_, i) => 120 + (i % 40) - 20);
const AFTER = Array.from({ length: 100 }, (_, i) => 96 + (i % 40) - 20);

describe("<ShiftHistogram> (plan/23 #14)", () => {
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
    expect(container.querySelectorAll('rect[data-mc-ink="bar"]').length).toBeGreaterThan(2);
    expect(container.querySelector("line")).not.toBeNull(); // center + medians
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
