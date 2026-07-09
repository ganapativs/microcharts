import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { DicePips } from "./index.js";
import { expectNoA11yViolations } from "../../test/a11y.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);

describe("<DicePips> (plan/24 #2)", () => {
  it("summary is the real string: '{n} out of 6.'", () => {
    const { container } = draw(<DicePips value={4} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe("4 out of 6.");
  });

  it("draws the face + `value` pips", () => {
    const { container } = draw(<DicePips value={5} />);
    expect(container.querySelectorAll("rect").length).toBe(1); // the face
    expect(container.querySelectorAll('circle[data-mc-ink="point"]').length).toBe(5);
  });

  it("face={false} drops the outline", () => {
    const { container } = draw(<DicePips value={3} face={false} />);
    expect(container.querySelector("rect")).toBeNull();
    expect(container.querySelectorAll("circle").length).toBe(3);
  });

  it("0 → empty face, '0 out of 6.'", () => {
    const { container } = draw(<DicePips value={0} />);
    expect(container.querySelectorAll("circle").length).toBe(0);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe("0 out of 6.");
  });

  it("> 6 → centered numeral, summary drops the frame", () => {
    const { container } = draw(<DicePips value={9} />);
    expect(container.querySelector("text")!.textContent).toBe("9");
    expect(container.querySelectorAll("circle").length).toBe(0);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe("9.");
  });

  it("negatives are invalid → 'No data.'", () => {
    const { container } = draw(<DicePips value={-1} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe("No data.");
  });

  it("summary={false} hides it from assistive tech", () => {
    const { container } = draw(<DicePips value={4} summary={false} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBeNull();
  });

  it("is axe-clean", async () => {
    const { container } = draw(<DicePips value={4} title="Severity" />);
    await expectNoA11yViolations(container);
  });
});
