import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { BalanceBeam } from "./index.js";
import { expectNoA11yViolations } from "../../test/a11y.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);
const IN_OUT = [
  { label: "Inflow", value: 620 },
  { label: "outflow", value: 480 },
] as const;

describe("<BalanceBeam>", () => {
  it("summary names both sides and the heavier one", () => {
    const { container } = draw(<BalanceBeam data={IN_OUT} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "Inflow 620 vs outflow 480; Inflow heavier.",
    );
  });

  it("equal weights → balanced", () => {
    const { container } = draw(
      <BalanceBeam
        data={[
          { label: "A", value: 500 },
          { label: "B", value: 500 },
        ]}
      />,
    );
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "A 500 vs B 500; balanced.",
    );
  });

  it("renders fulcrum, beam, and two square weights by default", () => {
    const { container } = draw(<BalanceBeam data={IN_OUT} />);
    expect(container.querySelectorAll("path").length).toBe(1); // fulcrum
    expect(container.querySelectorAll("line").length).toBe(1); // beam
    expect(container.querySelectorAll("rect").length).toBe(2); // weights
  });

  it("shape='round' → circle weights", () => {
    const { container } = draw(<BalanceBeam data={IN_OUT} shape="round" />);
    expect(container.querySelectorAll("circle").length).toBe(2);
    expect(container.querySelectorAll("rect").length).toBe(0);
  });

  it("label='values' prints both numerals", () => {
    const { container } = draw(<BalanceBeam data={IN_OUT} label="values" />);
    const texts = [...container.querySelectorAll("text")].map((t) => t.textContent);
    expect(texts).toEqual(["620", "480"]);
  });

  it("summary={false} hides it from assistive tech", () => {
    const { container } = draw(<BalanceBeam data={IN_OUT} summary={false} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBeNull();
  });

  it("is axe-clean", async () => {
    const { container } = draw(<BalanceBeam data={IN_OUT} title="Cash flow" />);
    await expectNoA11yViolations(container);
  });
});
