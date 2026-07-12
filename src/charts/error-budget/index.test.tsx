import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { ErrorBudget } from "./index.js";
import { expectNoA11yViolations } from "../../test/a11y.js";
import { seriesEdgeSuite } from "../../test/edge-cases.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);
const OBSERVED = [1, 0.96, 0.93, 0.9, 0.86, 0.83, 0.79, 0.75, 0.71, 0.67, 0.64, 0.62];

describe("<ErrorBudget>", () => {
  it("summary states remaining, elapsed, and burn rate — the real string", () => {
    const { container } = draw(<ErrorBudget data={OBSERVED} window={30} unit="day" />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "62% of error budget remains at day 12 of 30 — burning at 0.6× the steady rate.",
    );
  });

  it("exhausted budget → 'Budget exhausted at day N of M'", () => {
    const { container } = draw(
      <ErrorBudget data={[1, 0.7, 0.4, 0.1, 0, 0]} window={10} unit="day" />,
    );
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "Budget exhausted at day 5 of 10.",
    );
  });

  it("diagonal + faster-rate reference lines + actual line", () => {
    const { container } = draw(<ErrorBudget data={OBSERVED} />);
    // diagonal = 1 line, wedges (6×,14.4×) = 2 muted paths, actual = 1 data path
    expect(container.querySelectorAll('[data-mc-ink="muted"]').length).toBe(3);
    expect(container.querySelector('path[data-mc-ink="data"]')).not.toBeNull();
  });

  it("rates={[1]} → diagonal only (quietest form, no faster wedges)", () => {
    const { container } = draw(<ErrorBudget data={OBSERVED} rates={[1]} />);
    // just the diagonal line, no wedge paths
    expect(container.querySelectorAll('path[data-mc-ink="muted"]').length).toBe(0);
  });

  it("label='remaining' states the current %; 'none' shows no text", () => {
    const labeled = draw(<ErrorBudget data={OBSERVED} window={30} />).container;
    const none = draw(<ErrorBudget data={OBSERVED} label="none" />).container;
    expect(labeled.querySelector("text")!.textContent).toBe("62%");
    expect(none.querySelector("text")).toBeNull();
  });

  it("exhausted draws an ✕ (two crossing lines), not an endpoint dot", () => {
    const { container } = draw(<ErrorBudget data={[1, 0.5, 0, 0]} window={8} />);
    expect(container.querySelector("circle")).toBeNull();
  });

  it("is axe-clean", async () => {
    const { container } = draw(<ErrorBudget data={OBSERVED} window={30} title="Checkout SLO" />);
    await expectNoA11yViolations(container);
  });
});

seriesEdgeSuite("ErrorBudget", (data) => <ErrorBudget data={data as number[]} title="Edge" />);
