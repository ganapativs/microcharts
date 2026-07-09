import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { SproutRow } from "./index.js";
import { expectNoA11yViolations } from "../../test/a11y.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);
const ACCT = [
  { label: "Acme", value: 3 },
  { label: "Beta", value: 2 },
  { label: "Gamma", value: 3 },
  { label: "Delta", value: 1 },
  { label: "Echo", value: 0 },
  { label: "Foxtrot", value: 2 },
] as const;

describe("<SproutRow> (plan/24 #9)", () => {
  it("summary counts blooms and seeds", () => {
    const { container } = draw(<SproutRow data={ACCT} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "6 items; 2 at bloom, 1 at seed.",
    );
  });

  it("renders soil + one glyph per non-null item", () => {
    const { container } = draw(<SproutRow data={ACCT} />);
    expect(container.querySelectorAll("line").length).toBe(1); // soil
    expect(container.querySelectorAll('path[data-mc-ink="point"]').length).toBe(6);
  });

  it("null stage → no glyph (soil tick only)", () => {
    const { container } = draw(
      <SproutRow
        data={[
          { label: "A", value: 2 },
          { label: "B", value: null },
        ]}
      />,
    );
    expect(container.querySelectorAll('path[data-mc-ink="point"]').length).toBe(1);
  });

  it("labels renders category labels; label='value' prints stage numbers", () => {
    const withCats = draw(<SproutRow data={ACCT} labels />).container;
    expect([...withCats.querySelectorAll("text")].map((t) => t.textContent)).toContain("Acme");
    const withVals = draw(<SproutRow data={ACCT} label="value" />).container;
    expect([...withVals.querySelectorAll("text")].map((t) => t.textContent)).toContain("3");
  });

  it("summary={false} hides it from assistive tech", () => {
    const { container } = draw(<SproutRow data={ACCT} summary={false} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBeNull();
  });

  it("is axe-clean", async () => {
    const { container } = draw(<SproutRow data={ACCT} title="Account health" />);
    await expectNoA11yViolations(container);
  });
});
