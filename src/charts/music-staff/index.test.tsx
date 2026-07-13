import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { MusicStaff } from "./index.js";
import { expectNoA11yViolations } from "../../test/a11y.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);
const MELODY = [3, 5, 4, 8, 6, 9];

describe("<MusicStaff>", () => {
  it("summary reuses describeSeries verbatim", () => {
    const { container } = draw(<MusicStaff data={MELODY} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "Trending up 200%. Range 3 to 9. Last value 9.",
    );
  });

  it("renders the staff + one note per finite value", () => {
    const { container } = draw(<MusicStaff data={MELODY} />);
    // staff path (1) + no ledger for a mid-range melody at these positions
    expect(container.querySelectorAll('path[data-mc-ink="muted"]').length).toBeGreaterThanOrEqual(
      1,
    );
    expect(container.querySelectorAll("ellipse").length).toBe(6);
  });

  it("null values are rests (no note)", () => {
    const { container } = draw(<MusicStaff data={[3, null, 9]} />);
    expect(container.querySelectorAll("ellipse").length).toBe(2);
  });

  it("label='last' prints the final value", () => {
    const { container } = draw(<MusicStaff data={MELODY} label="last" />);
    expect(container.querySelector("text")!.textContent).toBe("9");
  });

  it("summary={false} hides it from assistive tech", () => {
    const { container } = draw(<MusicStaff data={MELODY} summary={false} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBeNull();
  });

  it("is axe-clean", async () => {
    const { container } = draw(<MusicStaff data={MELODY} title="Sprint melody" />);
    await expectNoA11yViolations(container);
  });
});
