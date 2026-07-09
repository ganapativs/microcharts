import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { CometTrail, cometTrailSummary } from "./index.js";
import { expectNoA11yViolations } from "../../test/a11y.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);

const RISING = [40, 45, 50, 55, 60, 65, 70, 72, 75, 78, 80, 84, 87];

describe("<CometTrail> (plan/24 #21)", () => {
  it("summary states the now-value and the recent trend", () => {
    const { container } = draw(<CometTrail data={RISING} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "Now 87, rising over the last 12 updates.",
    );
  });

  it("falling / steady trend words", () => {
    expect(cometTrailSummary([9, 6, 3])).toBe("Now 3, falling over the last 2 updates.");
    expect(cometTrailSummary([5, 5, 5])).toBe("Now 5, steady over the last 2 updates.");
  });

  it("single point → 'Now {v}.'", () => {
    expect(cometTrailSummary([87])).toBe("Now 87.");
  });

  it("renders a trail + a head dot", () => {
    const { container } = draw(<CometTrail data={[1, 2, 3, 4]} />);
    expect(container.querySelectorAll('circle[data-mc-ink="point"]').length).toBe(3);
    expect(container.querySelector(".mc-comet-head")).not.toBeNull();
  });

  it('label="last" prints the now-value', () => {
    const { container } = draw(<CometTrail data={RISING} />);
    expect(container.querySelector('text[data-mc-ink="label"]')!.textContent).toBe("87");
  });

  it('label="none" drops the numeral', () => {
    const { container } = draw(<CometTrail data={RISING} label="none" />);
    expect(container.querySelector('text[data-mc-ink="label"]')).toBeNull();
  });

  it("empty → 'No data.'", () => {
    const { container } = draw(<CometTrail data={[]} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe("No data.");
  });

  it("summary={false} hides it", () => {
    const { container } = draw(<CometTrail data={RISING} summary={false} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBeNull();
  });

  it("is axe-clean", async () => {
    const { container } = draw(<CometTrail data={RISING} title="Price" />);
    await expectNoA11yViolations(container);
  });
});
