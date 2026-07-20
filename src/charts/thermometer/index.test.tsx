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

describe("<Thermometer> degrades at small sizes", () => {
  // The value numeral is reserved BESIDE the tube, so on a narrow box the
  // gutter eats the instrument — and past that, exceeds the box outright and
  // renders the numeral at a negative x. The numeral is what degrades.
  it("keeps the numeral while the tube keeps its minimum width (20 wide)", () => {
    const { container } = draw(<Thermometer value={72} label="value" width={20} height={48} />);
    expect(container.querySelector("text")!.textContent).toBe("72");
  });

  it("drops the numeral rather than squash the tube — and gives the gutter back", () => {
    const { container } = draw(<Thermometer value={72} label="value" width={19} height={48} />);
    expect(container.querySelector("text")).toBeNull();
    // the instrument still reads: a positive-width capsule and a real bulb
    const tube = container.querySelector('rect[data-mc-ink="fill"]')!;
    expect(Number(tube.getAttribute("width"))).toBeGreaterThan(0);
    const bulb = container.querySelector("circle")!;
    expect(Number(bulb.getAttribute("r"))).toBeGreaterThan(0);
    // the tube reclaims the whole box: the gutter left with the numeral
    expect(container.querySelector("svg")!.getAttribute("viewBox")).toBe("0 0 19 48");
  });

  it("the numeral stays inside the box at the ends of the scale", () => {
    for (const value of [0, 100]) {
      const { container } = draw(
        <Thermometer value={value} label="value" width={30} height={48} />,
      );
      const t = container.querySelector("text")!;
      const fs = Number(t.getAttribute("font-size"));
      const y = Number(t.getAttribute("y"));
      expect(y - fs / 2).toBeGreaterThanOrEqual(0);
      expect(y + fs / 2).toBeLessThanOrEqual(48);
    }
  });
});
