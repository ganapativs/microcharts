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

  it("a hostile config prop never reaches the DOM", () => {
    // Host-computed knobs (`Number(field.value)`, `boxPx / weeks`) used to paint
    // cx/cy/r="NaN" inside viewBox="0 0 1 1" — or, for a NaN `domain`, a grid of
    // r="0" dots under a summary still announcing the peak.
    for (const p of [
      { rows: NaN },
      { rows: -3 },
      { cell: Infinity },
      { cell: -5 },
      { gap: NaN },
      { steps: NaN as unknown as 5 },
      { domain: [NaN, NaN] as const },
    ]) {
      const { container } = draw(<GardenGrid data={WEEKS} {...p} />);
      const svg = container.querySelector("svg")!;
      expect(svg.getAttribute("viewBox")).toBe("0 0 24 84");
      const rs = [...container.querySelectorAll('circle[data-mc-ink="point"]')].map((c) =>
        Number(c.getAttribute("r")),
      );
      expect(rs.length).toBe(9);
      expect(rs.every((r) => Number.isFinite(r) && r > 0)).toBe(true);
    }
  });

  it("the zero ring keeps 2-dp coords at any cell size", () => {
    const { container } = draw(<GardenGrid data={[0]} cell={9} />);
    expect(container.querySelector('circle[data-mc-ink="muted"]')!.getAttribute("r")).toBe("2.7");
  });

  it("is axe-clean", async () => {
    const { container } = draw(<GardenGrid data={WEEKS} title="Activity" />);
    await expectNoA11yViolations(container);
  });
});
