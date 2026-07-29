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

  it("empty slots are crisp when the filled cells are — one square vocabulary", () => {
    const { container } = draw(<HeatStrip data={[3, null]} />);
    const empty = container.querySelector('rect[data-mc-ink="muted"]')!;
    expect(empty.getAttribute("shape-rendering")).toBe("crispEdges");
    expect(
      draw(<HeatStrip data={[3, null]} shape="round" />)
        .container.querySelector('rect[data-mc-ink="muted"]')!
        .getAttribute("shape-rendering"),
    ).toBeNull();
  });

  it("is axe-clean", async () => {
    const { container } = draw(<HeatStrip data={[3, 8, 12]} title="Load per hour" />);
    await expectNoA11yViolations(container);
  });
});

seriesEdgeSuite("HeatStrip", (data) => <HeatStrip data={data} title="Edge" />);

describe("<HeatStrip> hostile config", () => {
  const data = [3, 5, 4, 9, 7, 12];
  const NUMERIC = ["x", "y", "width", "height", "rx"] as const;
  const values = (container: HTMLElement) => {
    const svg = container.querySelector("svg")!;
    const out = [svg.getAttribute("viewBox") ?? "", svg.getAttribute("style") ?? ""];
    for (const r of container.querySelectorAll("rect")) {
      for (const a of NUMERIC) out.push(r.getAttribute(a) ?? "0");
      out.push(r.getAttribute("style") ?? "");
    }
    return out;
  };
  const expectClean = (container: HTMLElement, what: string) =>
    expect(
      values(container).filter((v) => /NaN|Infinity/.test(v)),
      `${what} emitted a non-finite value`,
    ).toEqual([]);

  // A host computes these rather than typing them: `Number(field.value)` on an
  // empty input is NaN, `box / n` with n momentarily 0 is Infinity. Each one
  // painted `x="NaN"` (or `--mc-cell-mix: NaN`, which drops the whole ramp)
  // under an aria-label that read perfectly.
  it("a non-finite steps/width/height never reaches an attribute or a custom property", () => {
    for (const bad of [NaN, Infinity, -Infinity, 0, -40]) {
      expectClean(draw(<HeatStrip data={data} steps={bad} />).container, `steps=${bad}`);
      expectClean(draw(<HeatStrip data={data} width={bad} />).container, `width=${bad}`);
      expectClean(draw(<HeatStrip data={data} height={bad} />).container, `height=${bad}`);
    }
  });

  it("an unusable box falls back to the documented default frame", () => {
    for (const bad of [NaN, Infinity, 0, -40]) {
      const { container } = draw(<HeatStrip data={data} width={bad} height={bad} />);
      expect(container.querySelector("svg")!.getAttribute("viewBox")).toBe("0 0 60 10");
    }
  });

  it("paints the step count the cells were bucketed against", () => {
    // `steps={1}` bucketed against a clamped 2 while the ramp read the raw 1,
    // so every cell painted at the hottest mix — a scale nothing was binned on.
    const { container } = draw(<HeatStrip data={[0, 5, 10]} steps={1} domain={[0, 10]} />);
    const mix = [...container.querySelectorAll('rect[data-mc-ink="cell"]')].map((r) =>
      (r as SVGElement).style.getPropertyValue("--mc-cell-mix"),
    );
    expect(mix).toEqual(["28", "82", "82"]);
  });

  it("dense dot strips still paint — the padding never eats the whole cell", () => {
    // 60 cells in a 60-unit strip are 0.8 units wide; the dot inset floor (0.5)
    // used to make every rect NEGATIVE-width, which is an SVG error: nothing drew.
    const { container } = draw(
      <HeatStrip data={Array.from({ length: 60 }, (_, i) => i)} shape="dot" />,
    );
    const widths = [...container.querySelectorAll("rect")].map((r) =>
      Number(r.getAttribute("width")),
    );
    expect(widths).toHaveLength(60);
    for (const w of widths) expect(w).toBeGreaterThan(0);
  });
});
