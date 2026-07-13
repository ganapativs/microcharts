import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { FatDigits } from "./index.js";
import { expectNoA11yViolations } from "../../test/a11y.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);

describe("<FatDigits>", () => {
  it("summary is the real string: '{value} — tier {t} of {tiers}.'", () => {
    const { container } = draw(<FatDigits value={1204} domain={[0, 1500]} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe("1,204 — tier 4 of 5.");
  });

  it("digit mode summary is just the exact value", () => {
    const { container } = draw(<FatDigits value={1204} encode="digit" />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe("1,204.");
  });

  it("value mode → one weighted tspan carrying the whole numeral", () => {
    const { container } = draw(<FatDigits value={80} domain={[0, 100]} />);
    const tspans = container.querySelectorAll("tspan");
    expect(tspans.length).toBe(1);
    expect(tspans[0]!.textContent).toBe("80");
    expect(tspans[0]!.getAttribute("style")).toContain("font-weight");
  });

  it("digit mode → one tspan per character (incl. the grouping separator)", () => {
    const { container } = draw(<FatDigits value={1902} encode="digit" />);
    expect(container.querySelectorAll("tspan").length).toBe(5); // "1,902"
  });

  it("no domain → the middle tier (docs steer to always pass a domain)", () => {
    const { container } = draw(<FatDigits value={999} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe("999 — tier 3 of 5.");
  });

  it("non-finite → 'No data.'", () => {
    const { container } = draw(<FatDigits value={NaN} domain={[0, 100]} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe("No data.");
    expect(container.querySelector("text")).toBeNull();
  });

  it("summary={false} hides it from assistive tech", () => {
    const { container } = draw(<FatDigits value={80} domain={[0, 100]} summary={false} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBeNull();
  });

  it("is axe-clean", async () => {
    const { container } = draw(<FatDigits value={1204} domain={[0, 1500]} title="Revenue" />);
    await expectNoA11yViolations(container);
  });
});
