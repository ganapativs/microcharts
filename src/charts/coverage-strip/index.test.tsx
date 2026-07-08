import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { CoverageStrip } from "./index.js";
import { expectNoA11yViolations } from "../../test/a11y.js";
import { seriesEdgeSuite } from "../../test/edge-cases.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);

describe("<CoverageStrip> (plan/23 #1, S1-with-gaps)", () => {
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
    // the measured zero is a solid accent cell; the gap is a faint track slot
    expect(rects[0]!.getAttribute("data-mc-ink")).toBe("cell");
    expect(rects[1]!.getAttribute("data-mc-ink")).toBe("gap");
    expect(rects[1]!.getAttribute("fill")).toBe("var(--mc-band)");
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
