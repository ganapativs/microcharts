import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { Honeycomb } from "./index.js";
import { expectNoA11yViolations } from "../../test/a11y.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);

describe("<Honeycomb> (plan/24 #15)", () => {
  it("summary is the real string with the unit", () => {
    const { container } = draw(<Honeycomb value={34} total={40} unit="seats" />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "34 of 40 seats filled.",
    );
  });

  it("renders exactly two paths (filled + empty)", () => {
    const { container } = draw(<Honeycomb value={6} total={12} />);
    expect(container.querySelectorAll("path").length).toBe(2);
  });

  it("value > total → all filled, but the summary keeps the true value", () => {
    const { container } = draw(<Honeycomb value={45} total={40} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe("45 of 40 filled.");
    // all filled → no empty path
    expect(container.querySelectorAll("path").length).toBe(1);
  });

  it("empty='dim' fills the empty cells at low opacity", () => {
    const { container } = draw(<Honeycomb value={6} total={12} empty="dim" />);
    expect(container.querySelector('path[data-mc-ink="fill"]')).not.toBeNull();
  });

  it("total 0 → 'No data.'", () => {
    const { container } = draw(<Honeycomb value={5} total={0} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe("No data.");
  });

  it("summary={false} hides it from assistive tech", () => {
    const { container } = draw(<Honeycomb value={6} total={12} summary={false} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBeNull();
  });

  it("is axe-clean", async () => {
    const { container } = draw(<Honeycomb value={34} total={40} unit="seats" title="Occupancy" />);
    await expectNoA11yViolations(container);
  });
});
