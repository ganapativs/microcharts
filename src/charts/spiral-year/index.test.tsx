import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { SpiralYear, spiralYearSummary } from "./index.js";
import { expectNoA11yViolations } from "../../test/a11y.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);

// 52 weeks peaking at week 30 (index 29), low at week 6 (index 5).
const YEAR = Array.from({ length: 52 }, (_, i) => (i === 29 ? 480 : i === 5 ? 10 : 100 + i));

describe("<SpiralYear> (plan/24 #18)", () => {
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

  it("renders month ticks + ≤ steps mark paths", () => {
    const { container } = draw(<SpiralYear data={YEAR} size={48} />);
    expect(container.querySelectorAll('line[data-mc-ink="muted"]').length).toBe(12);
    expect(container.querySelectorAll("path").length).toBeLessThanOrEqual(5);
  });

  it("monthTicks={false} drops the ticks", () => {
    const { container } = draw(<SpiralYear data={YEAR} monthTicks={false} />);
    expect(container.querySelector('line[data-mc-ink="muted"]')).toBeNull();
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

  it("is axe-clean", async () => {
    const { container } = draw(<SpiralYear data={YEAR} title="Seasonality" />);
    await expectNoA11yViolations(container);
  });
});
