import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { CohortTriangle } from "./index.js";
import type { CohortRow } from "./geometry.js";
import { expectNoA11yViolations } from "../../test/a11y.js";
import { seriesEdgeSuite } from "../../test/edge-cases.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);
const opacities = (r: ReturnType<typeof draw>) =>
  [...r.container.querySelectorAll("rect")].map((n) => n.getAttribute("fill-opacity"));

const COHORTS: CohortRow[] = [
  { label: "Jan", values: [1, 0.6, 0.45, 0.4, 0.38] },
  { label: "Feb", values: [1, 0.5, 0.4, 0.35] },
  { label: "Mar", values: [1, 0.44, 0.34] },
  { label: "Apr", values: [1, 0.52] },
];

describe("<CohortTriangle>", () => {
  it("renders one cell per observed age, role=img", () => {
    const { container } = draw(<CohortTriangle data={COHORTS} labels={false} title="Cohorts" />);
    expect(container.querySelector("svg")!.getAttribute("role")).toBe("img");
    expect(container.querySelectorAll("rect")).toHaveLength(5 + 4 + 3 + 2);
  });

  it("real cells carry the cell ink + per-level opacity; gaps carry gap ink", () => {
    const { container } = draw(
      <CohortTriangle data={[{ label: "c", values: [0.1, Number.NaN, 1] }]} labels={false} />,
    );
    const cells = container.querySelectorAll('rect[data-mc-ink="cell"]');
    const gaps = container.querySelectorAll('rect[data-mc-ink="gap"]');
    expect(cells).toHaveLength(2);
    expect(gaps).toHaveLength(1);
    const lo = Number(cells[0]!.getAttribute("fill-opacity"));
    const hi = Number(cells[1]!.getAttribute("fill-opacity"));
    expect(hi).toBeGreaterThan(lo);
  });

  it("summary names the worst vintage at equal maturity + the newest's start", () => {
    const { container } = draw(<CohortTriangle data={COHORTS} title="Cohorts" />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "Cohorts. 4 cohorts; at period 1, Mar retains worst (44%); newest Apr starts at 100%.",
    );
  });

  it("single cohort → short summary (no comparison)", () => {
    const { container } = draw(
      <CohortTriangle data={[{ label: "Jan", values: [1, 0.6, 0.4] }]} title="One" />,
    );
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "One. 1 cohort; Jan starts at 100%.",
    );
  });

  it("row labels seat by default and drop at tiny cell sizes", () => {
    const big = draw(<CohortTriangle data={COHORTS} cell={11} />);
    const texts = [...big.container.querySelectorAll("text")].map((t) => t.textContent);
    expect(texts).toEqual(["Jan", "Feb", "Mar", "Apr"]);

    const small = draw(<CohortTriangle data={COHORTS} cell={5} />);
    expect(small.container.querySelectorAll("text")).toHaveLength(0);
  });

  it("highlight rings the named cohort (accent stroke, support width)", () => {
    const { container } = draw(<CohortTriangle data={COHORTS} highlight="Mar" labels={false} />);
    const ring = container.querySelector('rect[stroke="var(--mc-accent)"]');
    expect(ring).not.toBeNull();
    expect(ring!.getAttribute("data-mc-w")).toBe("support");
    expect(ring!.getAttribute("fill")).toBe("none");
  });

  it("empty → no cells, 'No data.'", () => {
    const { container } = draw(<CohortTriangle data={[]} title="e" />);
    expect(container.querySelectorAll("rect[data-mc-ink]")).toHaveLength(0);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe("e. No data.");
  });

  it("percent-scale input renders identically to fraction input", () => {
    const pct = draw(<CohortTriangle data={[{ label: "c", values: [100, 44] }]} labels={false} />);
    const frac = draw(<CohortTriangle data={[{ label: "c", values: [1, 0.44] }]} labels={false} />);
    expect(opacities(pct)).toEqual(opacities(frac));
  });

  // The announced scale and the painted scale must be the same scale: a hostile
  // `cell`/`gap` used to leave the aria-label reading the retention correctly
  // while the box was `viewBox="0 0 NaN NaN"` and the chart had vanished.
  it.each([
    ["cell", Number.NaN],
    ["cell", Number.POSITIVE_INFINITY],
    ["gap", Number.NaN],
    ["gap", Number.POSITIVE_INFINITY],
    ["gap", -20],
  ])("hostile %s renders a finite box and finite marks", (prop, bad) => {
    const { container } = draw(<CohortTriangle data={COHORTS} {...{ [prop]: bad }} title="t" />);
    const svg = container.querySelector("svg")!;
    expect(svg.getAttribute("viewBox")).toMatch(/^0 0 \d+(\.\d+)? \d+(\.\d+)?$/);
    for (const r of container.querySelectorAll("rect"))
      for (const a of ["x", "y", "width", "height"])
        expect(Number.isFinite(Number(r.getAttribute(a)))).toBe(true);
  });

  it("cells paint the resolved cell edge, crisp", () => {
    const { container } = draw(
      <CohortTriangle data={COHORTS} cell={Number.NaN} labels={false} title="t" />,
    );
    const first = container.querySelector("rect")!;
    expect(first.getAttribute("width")).toBe("9");
    expect(first.getAttribute("shape-rendering")).toBe("crispEdges");
  });

  it("is axe-clean", async () => {
    const { container } = draw(<CohortTriangle data={COHORTS} title="Cohorts" />);
    await expectNoA11yViolations(container);
  });
});

seriesEdgeSuite("CohortTriangle", (data) => (
  <CohortTriangle data={[{ label: "c", values: [...data] }]} title="Edge" />
));
