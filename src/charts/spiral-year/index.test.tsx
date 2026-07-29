import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { SpiralYear, spiralYearSummary } from "./index.js";
import { expectNoA11yViolations } from "../../test/a11y.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);

// 52 weeks peaking at week 30 (index 29), low at week 6 (index 5).
const YEAR = Array.from({ length: 52 }, (_, i) => (i === 29 ? 480 : i === 5 ? 10 : 100 + i));

describe("<SpiralYear>", () => {
  it("summary names the count, peak, and low with period labels", () => {
    const { container } = draw(<SpiralYear data={YEAR} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "52 weeks; peak 480 in week 30, low in week 6.",
    );
  });

  it("day-cadence summary switches the period word", () => {
    const days = Array.from({ length: 120 }, (_, i) => i);
    expect(spiralYearSummary(days)).toBe("120 days; peak 119 in day 120, low in day 1.");
  });

  it("renders the 12 month ticks merged into one path + ≤ steps mark paths", () => {
    const { container } = draw(<SpiralYear data={YEAR} size={48} />);
    const ticks = container.querySelector('path[data-mc-ink="muted"]');
    expect(ticks).not.toBeNull();
    expect((ticks!.getAttribute("d")!.match(/M/g) ?? []).length).toBe(12);
    expect(container.querySelectorAll("path").length).toBeLessThanOrEqual(6);
  });

  it("monthTicks={false} drops the ticks", () => {
    const { container } = draw(<SpiralYear data={YEAR} monthTicks={false} />);
    expect(container.querySelector('path[data-mc-ink="muted"]')).toBeNull();
  });

  it("steps=3 quantizes to three levels", () => {
    const { container } = draw(<SpiralYear data={[0, 50, 100]} steps={3} monthTicks={false} />);
    expect(container.querySelectorAll("path").length).toBeLessThanOrEqual(3);
  });

  it("empty → 'No data.'", () => {
    const { container } = draw(<SpiralYear data={[]} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe("No data.");
  });

  it("summary={false} hides it", () => {
    const { container } = draw(<SpiralYear data={YEAR} summary={false} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBeNull();
  });

  // The announced scale and the painted scale have to be the same scale: a bad
  // `size` used to leave a confident summary over a chart that painted nothing.
  it("a non-finite size keeps the frame, the seat, and the marks finite", () => {
    const { container } = draw(<SpiralYear data={YEAR} size={NaN} />);
    const svg = container.querySelector("svg")!;
    expect(svg.getAttribute("viewBox")).toBe("0 0 24 24");
    expect(svg.getAttribute("style")).not.toMatch(/NaN|Infinity/);
    expect(container.innerHTML).not.toMatch(/NaN|Infinity/);
    expect(svg.getAttribute("aria-label")).toBe("52 weeks; peak 480 in week 30, low in week 6.");
  });

  it("steps outside the documented 3 | 5 still paints the ramp", () => {
    const { container } = draw(<SpiralYear data={YEAR} steps={Infinity as unknown as 5} />);
    const marks = container.querySelectorAll('path[data-mc-ink="bar"]');
    expect(marks.length).toBeGreaterThan(0);
    for (const p of marks) expect(p.getAttribute("d")).not.toBe("");
  });

  it("is axe-clean", async () => {
    const { container } = draw(<SpiralYear data={YEAR} title="Seasonality" />);
    await expectNoA11yViolations(container);
  });
});
