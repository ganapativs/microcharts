import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { StreakSpark } from "./index.js";
import { expectNoA11yViolations } from "../../test/a11y.js";
import { seriesEdgeSuite } from "../../test/edge-cases.js";

// runs: 9 passing, 1 fail, 4 passing, 2 fail, 3 passing → current 3, record 9.
const STREAK = [
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  false,
  true,
  true,
  true,
  true,
  false,
  false,
  true,
  true,
  true,
];
const D = [true, true, false, true]; // runs: ok2, fail1, ok1
const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);

describe("<StreakSpark> static structure", () => {
  it("renders one rect per run, role=img", () => {
    const { container } = draw(<StreakSpark data={D} title="Deploys" />);
    expect(container.querySelector("svg")!.getAttribute("role")).toBe("img");
    expect(container.querySelectorAll("rect")).toHaveLength(3);
  });

  // Regression: the runs used to centre on the full box, leaving height * 0.25 of
  // headroom — below the label's own font size at every word-sized height. The
  // default `label="current"` therefore rendered no text at all until the chart
  // was ~48 units tall, against a default height of 20. The geometry now reserves
  // the label band, so the number seats at the default size.
  it("run-length label seats at the DEFAULT height, not just tall boxes", () => {
    const { container } = draw(<StreakSpark data={D} title="Deploys" />);
    expect(container.querySelectorAll("text").length).toBeGreaterThan(0);
  });

  it("label='none' reclaims the reserved label band for the runs", () => {
    const withLabel = draw(<StreakSpark data={D} label="current" />).container;
    const without = draw(<StreakSpark data={D} label="none" />).container;
    expect(without.querySelectorAll("text")).toHaveLength(0);
    const h = (c: HTMLElement) => Number(c.querySelector("rect")!.getAttribute("height"));
    expect(h(without)).toBeGreaterThan(h(withLabel));
  });

  it("current (last) run takes accent ink", () => {
    const { container } = draw(<StreakSpark data={D} />);
    const rects = [...container.querySelectorAll("rect")];
    expect(rects.at(-1)!.getAttribute("data-mc-ink")).toBe("accent");
  });

  it("ok runs are positive, break runs are negative", () => {
    const { container } = draw(<StreakSpark data={D} />);
    const inks = [...container.querySelectorAll("rect")].map((r) => r.getAttribute("data-mc-ink"));
    expect(inks).toContain("positive");
    expect(inks).toContain("negative");
  });

  it("the record streak wears a triangle tick (point ink)", () => {
    const { container } = draw(<StreakSpark data={D} />);
    const tri = container.querySelector('path[data-mc-ink="point"]');
    expect(tri).not.toBeNull();
  });

  it("no triangle when there is no completed streak (all fail)", () => {
    const { container } = draw(<StreakSpark data={[false, false, false]} />);
    expect(container.querySelector('path[data-mc-ink="point"]')).toBeNull();
  });

  it("rects use crispEdges", () => {
    const { container } = draw(<StreakSpark data={D} />);
    expect(container.querySelector("rect")!.getAttribute("shape-rendering")).toBe("crispEdges");
  });

  it("current count label seats at a legible height", () => {
    const { container } = draw(<StreakSpark data={D} height={48} label="current" />);
    const texts = [...container.querySelectorAll("text")].map((t) => t.textContent);
    expect(texts).toContain("1"); // the current run's length
  });

  it("auto summary reads current run, record and break count", () => {
    const { container } = draw(<StreakSpark data={STREAK} title="Deploys" />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "Deploys. Current run 3 passing; record 9; broke 2 times.",
    );
  });

  it("all-pass → unbroken summary", () => {
    const { container } = draw(
      <StreakSpark data={[true, true, true, true, true, true]} title="T" />,
    );
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "T. Current run 6 passing, unbroken.",
    );
  });

  it("all-fail → no-completed-streak summary", () => {
    const { container } = draw(<StreakSpark data={[false, false, false]} title="T" />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "T. Current run 3 failing; no completed streak.",
    );
  });

  it("empty data → no rects, 'No data.'", () => {
    const { container } = draw(<StreakSpark data={[]} title="e" />);
    expect(container.querySelectorAll("rect")).toHaveLength(0);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe("e. No data.");
  });
});

describe("<StreakSpark> a11y (axe, )", () => {
  it("informative chart is axe-clean", async () => {
    const { container } = draw(<StreakSpark data={STREAK} title="Deploys" />);
    await expectNoA11yViolations(container);
  });
});

seriesEdgeSuite("StreakSpark", (data) => (
  <StreakSpark data={[...data]} label="both" title="Edge" />
));
