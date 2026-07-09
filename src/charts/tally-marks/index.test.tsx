import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { TallyMarks } from "./index.js";
import { expectNoA11yViolations } from "../../test/a11y.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);

describe("<TallyMarks> (plan/24 #1)", () => {
  it("summary is the real string: '{n} counted.'", () => {
    const { container } = draw(<TallyMarks value={23} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe("23 counted.");
  });

  it("draws one merged stroke path, no numeral below max", () => {
    const { container } = draw(<TallyMarks value={12} />);
    expect(container.querySelectorAll("path").length).toBe(1);
    expect(container.querySelector("text")).toBeNull();
  });

  it("value > max → a +N overflow numeral, count in the summary stays true", () => {
    const { container } = draw(<TallyMarks value={30} max={25} />);
    expect(container.querySelector("text")!.textContent).toBe("+5");
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe("30 counted.");
  });

  it("overflow='clamp' drops the numeral but keeps the true count in the name", () => {
    const { container } = draw(<TallyMarks value={30} max={25} overflow="clamp" />);
    expect(container.querySelector("text")).toBeNull();
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe("30 counted.");
  });

  it("value 0 → no marks, '0 counted.'", () => {
    const { container } = draw(<TallyMarks value={0} />);
    expect(container.querySelector("path")).toBeNull();
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe("0 counted.");
  });

  it("negatives clamp; the label size is pinned inline so labels aren't ambient-sized", () => {
    const { container } = draw(<TallyMarks value={-4} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe("0 counted.");
    const svg = container.querySelector("svg")!;
    expect(svg.getAttribute("style")).toContain("--mc-label-size");
  });

  it("summary={false} hides it from assistive tech (decorative opt-out)", () => {
    const { container } = draw(<TallyMarks value={5} summary={false} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBeNull();
  });

  it("is axe-clean", async () => {
    const { container } = draw(<TallyMarks value={23} title="Signatures" />);
    await expectNoA11yViolations(container);
  });
});
