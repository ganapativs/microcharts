import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { HeatStrip } from "./index.js";
import { expectNoA11yViolations } from "../../test/a11y.js";
import { seriesEdgeSuite } from "../../test/edge-cases.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);

describe("<HeatStrip>", () => {
  it("summary reuses describeSeries verbatim — the docs' real string", () => {
    const data = [3, 5, 4, 9, 7, 12, 15, 18, 17];
    const { container } = draw(<HeatStrip data={data} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "Trending up 467%. Range 3 to 18. Last value 17.",
    );
  });

  it("null slots render as hairline-outline empties — empty ≠ zero", () => {
    const { container } = draw(<HeatStrip data={[0, null, 8]} />);
    const rects = [...container.querySelectorAll("rect")];
    expect(rects.length).toBe(3);
    const empty = rects.filter((r) => r.getAttribute("fill") === "none");
    expect(empty.length).toBe(1);
    // the zero cell is a FILLED (faint) cell, not the outline
    expect(rects[0]!.getAttribute("data-mc-ink")).toBe("cell");
  });

  it("1 node per cell (node budget)", () => {
    const { container } = draw(<HeatStrip data={[1, 2, 3, 4, 5]} />);
    expect(container.querySelectorAll("svg *").length).toBe(5);
  });

  it("shape variants follow the shared cell vocabulary", () => {
    const dot = draw(<HeatStrip data={[1, 5, 9]} shape="dot" />).container;
    const sq = draw(<HeatStrip data={[1, 5, 9]} shape="square" />).container;
    expect(sq.querySelector("rect")!.getAttribute("shape-rendering")).toBe("crispEdges");
    expect(dot.querySelector('[data-mc-ink="cell"]')!.getAttribute("shape-rendering")).toBeNull();
  });

  it("is axe-clean", async () => {
    const { container } = draw(<HeatStrip data={[3, 8, 12]} title="Load per hour" />);
    await expectNoA11yViolations(container);
  });
});

seriesEdgeSuite("HeatStrip", (data) => <HeatStrip data={data} title="Edge" />);
