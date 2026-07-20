import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { CoverageStrip } from "./index.js";
import { expectNoA11yViolations } from "../../test/a11y.js";
import { seriesEdgeSuite } from "../../test/edge-cases.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);

describe("<CoverageStrip>", () => {
  it("summary states coverage + longest gap — the docs' real string", () => {
    const data = [1, 1, null, 1, null, null, 1];
    const { container } = draw(<CoverageStrip data={data} expected={8} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "4 of 8 slots measured (50%); longest gap 2 slots.",
    );
  });

  it("measured cells are filled, gaps are hollow — 0 ≠ null", () => {
    const { container } = draw(<CoverageStrip data={[0, null, 5]} />);
    const rects = [...container.querySelectorAll("rect")];
    expect(rects.length).toBe(3);
    // the measured zero is a solid accent cell; the gap is a faint track slot.
    // both colors come from ink-role rules (styles.css) — no inline fill now.
    expect(rects[0]!.getAttribute("data-mc-ink")).toBe("cell");
    expect(rects[1]!.getAttribute("data-mc-ink")).toBe("gap");
    expect(rects[1]!.getAttribute("fill")).toBe(null);
  });

  it("label='percent' states coverage in a right gutter (wider viewBox)", () => {
    const plain = draw(<CoverageStrip data={[1, null, 1, 1]} />).container;
    const labeled = draw(<CoverageStrip data={[1, null, 1, 1]} label="percent" />).container;
    const wPlain = plain.querySelector("svg")!.getAttribute("viewBox")!.split(" ")[2];
    const wLabeled = labeled.querySelector("svg")!.getAttribute("viewBox")!.split(" ")[2];
    expect(Number(wLabeled)).toBeGreaterThan(Number(wPlain));
    expect(labeled.querySelector("text")!.textContent).toBe("75%");
  });

  it("1 node per cell (node budget)", () => {
    const { container } = draw(<CoverageStrip data={[1, 2, 3, null, 5]} />);
    expect(container.querySelectorAll("svg *").length).toBe(5);
  });

  it("is axe-clean", async () => {
    const { container } = draw(<CoverageStrip data={[1, null, 3]} title="Sensor uptime" />);
    await expectNoA11yViolations(container);
  });
});

seriesEdgeSuite("CoverageStrip", (data) => <CoverageStrip data={data} title="Edge" />);

describe("<CoverageStrip> degrades at small sizes", () => {
  const DATA = [1, null, 3];
  // The percent rides the strip's midline; below one em of box height its
  // em-box crosses the viewBox edge, so it drops rather than spilling.
  it("keeps the percent while the box holds one em (height 7, font 7)", () => {
    const { container } = draw(
      <CoverageStrip data={DATA} expected={8} label="percent" width={80} height={7} />,
    );
    expect(container.querySelector("text")!.textContent).toBe("25%");
  });

  it("drops the percent below one em — cells stay, gutter goes", () => {
    const { container } = draw(
      <CoverageStrip data={DATA} expected={8} label="percent" width={80} height={6} />,
    );
    expect(container.querySelector("text")).toBeNull();
    // the mark still reads: measured cells AND the shape-carried gaps
    expect(container.querySelector('rect[data-mc-ink="cell"]')).not.toBeNull();
    expect(container.querySelector('rect[data-mc-ink="gap"]')).not.toBeNull();
    // the gutter leaves with the label — the viewBox is the plain box again
    expect(container.querySelector("svg")!.getAttribute("viewBox")).toBe("0 0 80 6");
  });

  it("the cells do not move when the percent drops (no reflow)", () => {
    const cellX = (h: number) =>
      [
        ...draw(
          <CoverageStrip data={DATA} expected={8} label="percent" width={80} height={h} />,
        ).container.querySelectorAll("rect"),
      ].map((r) => r.getAttribute("x"));
    expect(cellX(7)).toEqual(cellX(6));
  });
});
