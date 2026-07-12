import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { Thermometer } from "./index.js";
import { expectNoA11yViolations } from "../../test/a11y.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);

describe("<Thermometer>", () => {
  it("summary states the value on its calibrated scale", () => {
    const { container } = draw(<Thermometer value={72} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe("72 on a 0–100 scale.");
  });

  it("with a target, the summary states the goal", () => {
    const { container } = draw(<Thermometer value={72} target={80} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "72 on a 0–100 scale; target 80.",
    );
  });

  it("renders bulb, fill, tube, ticks", () => {
    const { container } = draw(<Thermometer value={72} />);
    expect(container.querySelectorAll("circle").length).toBe(1); // bulb
    // tube channel + fill + tube outline (all rounded-rect capsules)
    expect(container.querySelectorAll("rect").length).toBe(3);
    expect(container.querySelectorAll("path").length).toBe(1); // ticks
  });

  it("target renders a distinct flag line; bulb={false} drops the reservoir", () => {
    const { container } = draw(<Thermometer value={72} target={80} bulb={false} />);
    expect(container.querySelector('line[data-mc-ink="flag"]')).not.toBeNull();
    expect(container.querySelector("circle")).toBeNull();
  });

  it("label='value' prints the numeral", () => {
    const { container } = draw(<Thermometer value={72} label="value" />);
    expect(container.querySelector("text")!.textContent).toBe("72");
  });

  it("value over the domain still reports the true value", () => {
    const { container } = draw(<Thermometer value={140} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "140 on a 0–100 scale.",
    );
  });

  it("summary={false} hides it from assistive tech", () => {
    const { container } = draw(<Thermometer value={72} summary={false} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBeNull();
  });

  it("is axe-clean", async () => {
    const { container } = draw(<Thermometer value={72} target={80} title="Fundraiser" />);
    await expectNoA11yViolations(container);
  });
});
