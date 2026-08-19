import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { SparkBar } from "./index.js";
import { expectNoA11yViolations } from "../../test/a11y.js";
import { seriesEdgeSuite } from "../../test/edge-cases.js";

const D = [3, 5, 4, 7, 6, 9, 8, 11];
const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);

describe("<SparkBar> static structure", () => {
  it("renders one rect per finite value, role=img", () => {
    const { container } = draw(<SparkBar data={D} title="Weekly" />);
    expect(container.querySelector("svg")!.getAttribute("role")).toBe("img");
    expect(container.querySelectorAll("rect")).toHaveLength(D.length);
  });

  it("endpoint bar gets accent ink", () => {
    const { container } = draw(<SparkBar data={D} />);
    const rects = [...container.querySelectorAll("rect")];
    expect(rects.at(-1)!.getAttribute("data-mc-ink")).toBe("accent");
  });

  it("negative bars use the negative token", () => {
    const { container } = draw(<SparkBar data={[4, -3, 2]} />);
    const inks = [...container.querySelectorAll("rect")].map((r) => r.getAttribute("data-mc-ink"));
    expect(inks).toContain("negative");
  });

  it("win-loss mode → positive/negative inks only", () => {
    const { container } = draw(<SparkBar data={[1, -1, 1, 1, -1]} mode="winloss" />);
    const inks = new Set(
      [...container.querySelectorAll("rect")].map((r) => r.getAttribute("data-mc-ink")),
    );
    expect(inks).toEqual(new Set(["positive", "negative"]));
  });

  it("win-loss tie (0) → thin neutral dash on the mid-line, never valence ink", () => {
    const { container } = draw(<SparkBar data={[1, 0, -1]} mode="winloss" height={20} />);
    const rects = [...container.querySelectorAll("rect")];
    const tie = rects[1]!;
    expect(tie.getAttribute("data-mc-ink")).toBe("bar");
    expect(Number(tie.getAttribute("height"))).toBe(1);
    // sits on the mid-line: win above it, loss below it
    const [win, , loss] = rects;
    expect(Number(win!.getAttribute("y"))).toBeLessThan(Number(tie.getAttribute("y")));
    expect(Number(loss!.getAttribute("y"))).toBeGreaterThan(Number(tie.getAttribute("y")));
  });

  it("bars are square-cornered, so the stylesheet rasterizes them on the grid", () => {
    // `shape-rendering: crispEdges` moved out of the markup and onto
    // `rect:not([rx])` in styles.css, which covers every square rect in the
    // catalog instead of the 133 that remembered the attribute. What this chart
    // has to keep is the square corner that opts it in.
    const { container } = draw(<SparkBar data={D} />);
    const rect = container.querySelector("rect")!;
    expect(rect.getAttribute("rx")).toBeNull();
    expect(rect.getAttribute("shape-rendering")).toBeNull();
  });

  it("label='last' renders the endpoint value", () => {
    const { container } = draw(<SparkBar data={[1, 2, 3]} label="last" />);
    expect(container.querySelector("text")!.textContent).toBe("3");
  });

  it("auto-summary is the description", () => {
    const { container } = draw(<SparkBar data={D} title="T" />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toMatch(/Trending up/);
  });

  it("skips gaps: no rect for null", () => {
    const { container } = draw(<SparkBar data={[1, null, 3]} />);
    expect(container.querySelectorAll("rect")).toHaveLength(2);
  });

  it("empty data → no rects, 'No data.'", () => {
    const { container } = draw(<SparkBar data={[]} title="e" />);
    expect(container.querySelectorAll("rect")).toHaveLength(0);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe("e. No data.");
  });
});

describe("<SparkBar> hostile config never paints outside the frame", () => {
  const rects = (c: HTMLElement) =>
    [...c.querySelectorAll("rect")].map((r) => ({
      x: Number(r.getAttribute("x")),
      y: Number(r.getAttribute("y")),
      w: Number(r.getAttribute("width")),
      h: Number(r.getAttribute("height")),
    }));

  it("gap={NaN} renders the default spacing, not NaN coordinates", () => {
    const { container } = draw(<SparkBar data={D} gap={NaN} />);
    for (const r of rects(container)) {
      expect(Number.isFinite(r.x + r.y + r.w + r.h)).toBe(true);
    }
  });

  it("a value above an explicit domain truncates at the frame", () => {
    // 20 in a [0, 10] domain used to emit height="38" in a 20-unit viewBox —
    // `.mc-root` is overflow: visible, so it painted across the text around it.
    const { container } = draw(<SparkBar data={[2, 20]} domain={[0, 10]} height={20} />);
    for (const r of rects(container)) expect(r.y + r.h).toBeLessThanOrEqual(20);
  });

  it("a NaN domain bound keeps the scale the summary describes", () => {
    // The flattened midline it produced contradicted the announced range.
    const { container } = draw(<SparkBar data={D} domain={[NaN, NaN]} />);
    expect(rects(container)).toEqual(rects(draw(<SparkBar data={D} />).container));
  });

  it("height={NaN} resolves the same box the frame does", () => {
    const { container } = draw(<SparkBar data={D} height={NaN} label="last" />);
    const svg = container.querySelector("svg")!;
    expect(svg.getAttribute("viewBox")).toBe("0 0 80 20");
    expect(svg.getAttribute("style")).not.toMatch(/NaN/);
  });

  it("win-loss stays visible on a frame too short to halve", () => {
    const { container } = draw(<SparkBar data={[1, -1, 0]} mode="winloss" height={3} />);
    for (const r of rects(container)) {
      expect(r.h).toBeGreaterThan(0);
      expect(r.y + r.h).toBeLessThanOrEqual(3);
    }
  });
});

describe("<SparkBar> a11y (axe, )", () => {
  it("informative chart is axe-clean", async () => {
    const { container } = draw(<SparkBar data={D} title="Weekly" />);
    await expectNoA11yViolations(container);
  });
});

seriesEdgeSuite("SparkBar", (data) => <SparkBar data={[...data]} label="last" title="Edge" />);
