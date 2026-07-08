import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { IconArray } from "./index.js";
import { expectNoA11yViolations } from "../../test/a11y.js";
import { valueEdgeSuite } from "../../test/edge-cases.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);

describe("<IconArray> (plan/23 #21, S4 scalar rate)", () => {
  it("summary states the count and the percent — the docs' real string", () => {
    const { container } = draw(<IconArray value={0.15} of={20} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe("3 in 20. About 15%.");
  });

  it("k filled + (n−k) hollow units; denominator is always countable", () => {
    const { container } = draw(<IconArray value={0.15} of={20} />);
    expect(container.querySelectorAll('[data-mc-ink="unit"]').length).toBe(3);
    expect(container.querySelectorAll('[data-mc-ink="unit-off"]').length).toBe(17);
  });

  it("sub-unit rate is flagged, never faked as a partial fill", () => {
    const { container } = draw(<IconArray value={0.01} of={20} />);
    expect(container.querySelectorAll('[data-mc-ink="unit"]').length).toBe(0);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "0 in 20 (less than 1 in 20). About 0%.",
    );
  });

  it("label modes: ratio (default) vs percent", () => {
    const ratio = draw(<IconArray value={0.15} of={20} />).container;
    const pct = draw(<IconArray value={0.15} of={20} label="percent" />).container;
    expect(ratio.querySelector("text")!.textContent).toBe("3 in 20");
    expect(pct.querySelector("text")!.textContent).toBe("15%");
  });

  it("positive='down' flips the fill to the risk tone", () => {
    const { container } = draw(<IconArray value={0.15} of={20} positive="down" />);
    expect(container.querySelector('[data-mc-ink="unit"]')!.getAttribute("style")).toContain(
      "--mc-neg",
    );
  });

  it("is axe-clean", async () => {
    const { container } = draw(<IconArray value={0.15} of={20} title="Adverse events" />);
    await expectNoA11yViolations(container);
  });
});

valueEdgeSuite("IconArray", (value) => <IconArray value={value} title="Edge" />);
