import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { ActivityGrid } from "./index.js";
import { expectNoA11yViolations } from "../../test/a11y.js";
import { seriesEdgeSuite } from "../../test/edge-cases.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);
const days = Array.from({ length: 35 }, (_, i) => i % 7);

describe("<ActivityGrid> (plan/05 S1-binned, plan/08)", () => {
  it("renders one cell per value, role=img", () => {
    const { container } = draw(<ActivityGrid data={days} title="Activity" />);
    expect(container.querySelector("svg")!.getAttribute("role")).toBe("img");
    expect(container.querySelectorAll("rect")).toHaveLength(days.length);
  });

  it("cells carry the cell ink + per-level opacity", () => {
    const { container } = draw(<ActivityGrid data={[0, 10]} domain={[0, 10]} />);
    const rects = container.querySelectorAll('rect[data-mc-ink="cell"]');
    expect(rects).toHaveLength(2);
    const o0 = Number((rects[0] as HTMLElement).style.fillOpacity);
    const o1 = Number((rects[1] as HTMLElement).style.fillOpacity);
    expect(o1).toBeGreaterThan(o0);
  });

  it("summary states total, periods, and the busiest bin", () => {
    const { container } = draw(<ActivityGrid data={[1, 2, 3]} title="A" />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "A. Total 6 over 3 periods. Busiest 3.",
    );
  });

  it("strip layout → single row of cells", () => {
    const { container } = draw(<ActivityGrid data={[1, 2, 3, 4]} layout="strip" />);
    const ys = new Set([...container.querySelectorAll("rect")].map((r) => r.getAttribute("y")));
    expect(ys.size).toBe(1);
  });

  it("empty → no cells, 'No activity.'", () => {
    const { container } = draw(<ActivityGrid data={[]} title="e" />);
    expect(container.querySelectorAll("rect")).toHaveLength(0);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe("e. No activity.");
  });

  it("is axe-clean", async () => {
    const { container } = draw(<ActivityGrid data={days} title="Activity" />);
    await expectNoA11yViolations(container);
  });
});

seriesEdgeSuite("ActivityGrid", (data) => <ActivityGrid data={[...data]} title="Edge" />);
