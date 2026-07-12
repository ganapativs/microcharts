import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { GardenGrid } from "./index.js";
import { expectNoA11yViolations } from "../../test/a11y.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);
const WEEKS = [34, 10, 0, 20, 5, 0, 15, 8, 0, 25, 12, 3];

describe("<GardenGrid>", () => {
  it("summary reports peak and active count", () => {
    const { container } = draw(<GardenGrid data={WEEKS} unit="weeks" />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "12 weeks; peak 34, 9 active.",
    );
  });

  it("renders a circle per non-null cell (filled + zero rings)", () => {
    const { container } = draw(<GardenGrid data={WEEKS} />);
    // 12 cells, none null → 12 circles (9 filled + 3 rings)
    expect(container.querySelectorAll("circle").length).toBe(12);
    expect(container.querySelectorAll('circle[data-mc-ink="muted"]').length).toBe(3); // zero rings
  });

  it("empty='blank' drops the zero rings", () => {
    const { container } = draw(<GardenGrid data={WEEKS} empty="blank" />);
    expect(container.querySelectorAll("circle").length).toBe(9); // only the actives
  });

  it("null cells render nothing (missing ≠ zero)", () => {
    const { container } = draw(<GardenGrid data={[5, null, 8]} />);
    expect(container.querySelectorAll("circle").length).toBe(2);
  });

  it("all-zero → all rings (present, quiet)", () => {
    const { container } = draw(<GardenGrid data={[0, 0, 0, 0]} />);
    expect(container.querySelectorAll('circle[data-mc-ink="muted"]').length).toBe(4);
  });

  it("summary={false} hides it from assistive tech", () => {
    const { container } = draw(<GardenGrid data={WEEKS} summary={false} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBeNull();
  });

  it("is axe-clean", async () => {
    const { container } = draw(<GardenGrid data={WEEKS} title="Activity" />);
    await expectNoA11yViolations(container);
  });
});
