import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { Sparkline } from "./index.js";
import { expectNoA11yViolations } from "../../test/a11y.js";
import { seriesEdgeSuite } from "../../test/edge-cases.js";

const D = [4, 6, 5, 9, 7, 8, 11, 9, 13, 12];

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);

describe("<Sparkline> static structure", () => {
  it("renders a role=img svg with the data path", () => {
    const { container } = draw(<Sparkline data={D} title="Revenue" />);
    const svg = container.querySelector("svg")!;
    expect(svg.getAttribute("role")).toBe("img");
    expect(svg.classList.contains("mc-spark")).toBe(true);
    const path = container.querySelector('path[data-mc-ink="data"]')!;
    expect(path.getAttribute("d")!.startsWith("M")).toBe(true);
    expect(path.getAttribute("vector-effect")).toBe("non-scaling-stroke");
  });

  it("default dots='auto' → one accent endpoint dot, no min/max", () => {
    const { container } = draw(<Sparkline data={D} />);
    expect(container.querySelectorAll('[data-mc-ink="accent"]')).toHaveLength(1);
    expect(container.querySelectorAll('[data-mc-ink="point"]')).toHaveLength(0);
  });

  it("dots='minmax' adds two point marks", () => {
    const { container } = draw(<Sparkline data={D} dots="minmax" />);
    expect(container.querySelectorAll('[data-mc-ink="point"]')).toHaveLength(2);
  });

  it("dots='none' draws no marks", () => {
    const { container } = draw(<Sparkline data={D} dots="none" />);
    expect(container.querySelectorAll("circle")).toHaveLength(0);
  });

  it("fill adds an area path anchored at the baseline", () => {
    const { container } = draw(<Sparkline data={D} fill />);
    const area = container.querySelector('path[data-mc-ink="fill"]')!;
    expect(area).not.toBeNull();
    expect(area.getAttribute("d")!.endsWith("Z")).toBe(true);
  });

  it("band renders a rect below the line", () => {
    const { container } = draw(<Sparkline data={D} band={[6, 10]} />);
    const rect = container.querySelector('rect[data-mc-ink="band"]')!;
    expect(rect).not.toBeNull();
    expect(Number(rect.getAttribute("height"))).toBeGreaterThan(0);
  });

  it("label='last' renders the endpoint value as anchored text", () => {
    const { container } = draw(<Sparkline data={[1, 2, 3]} label="last" />);
    const text = container.querySelector("text")!;
    expect(text.getAttribute("text-anchor")).toBe("start");
    expect(text.textContent).toBe("3");
  });

  it("label='minmax' renders both extreme values in quiet label ink (when tall enough)", () => {
    const { container } = draw(<Sparkline data={[4, 9, 2, 7]} height={40} label="minmax" />);
    const labels = [...container.querySelectorAll('text[data-mc-ink="label"]')];
    expect(labels.map((t) => t.textContent).sort()).toEqual(["2", "9"]);
  });

  it("label='minmax' on a flat series renders one label, not two copies", () => {
    const { container } = draw(<Sparkline data={[5, 5, 5]} height={40} label="minmax" />);
    expect(container.querySelectorAll('text[data-mc-ink="label"]')).toHaveLength(1);
  });

  it("label='minmax' below the affordance height renders no labels (documented)", () => {
    const { container } = draw(<Sparkline data={[4, 9, 2, 7]} label="minmax" />);
    expect(container.querySelectorAll('text[data-mc-ink="label"]')).toHaveLength(0);
  });

  it("long series → the drawn path is decimated, dots still mark raw extremes", () => {
    const data = Array.from({ length: 5000 }, (_, i) => 50 + Math.sin(i / 9) * 30);
    const { container } = draw(<Sparkline data={data} dots="minmax" />);
    const d = container.querySelector('path[data-mc-ink="data"]')!.getAttribute("d")!;
    expect((d.match(/L/g) ?? []).length).toBeLessThanOrEqual(220);
    expect(container.querySelectorAll("circle").length).toBeGreaterThan(0);
  });

  it("curve='step' emits H/V commands; 'smooth' emits C", () => {
    const step = draw(<Sparkline data={D} curve="step" />)
      .container.querySelector('[data-mc-ink="data"]')!
      .getAttribute("d")!;
    expect(step).toMatch(/[HV]/);
    const smooth = draw(<Sparkline data={D} curve="smooth" />)
      .container.querySelector('[data-mc-ink="data"]')!
      .getAttribute("d")!;
    expect(smooth).toContain("C");
  });

  it("color overrides the line stroke inline (prop > token)", () => {
    const { container } = draw(<Sparkline data={D} color="#f50" />);
    const path = container.querySelector('[data-mc-ink="data"]') as SVGElement;
    expect(path.style.stroke).toBe("rgb(255, 85, 0)");
  });

  it("auto-summary is the accessible description", () => {
    const { container } = draw(<Sparkline data={[1, 2, 4]} title="T" />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toMatch(/Trending up/);
  });

  it("summary={false} → decorative, aria-hidden, no desc", () => {
    const { container } = draw(<Sparkline data={D} summary={false} />);
    const svg = container.querySelector("svg")!;
    expect(svg.getAttribute("aria-hidden")).toBe("true");
    expect(container.querySelector("desc")).toBeNull();
  });

  it("format applies to the summary and label", () => {
    const { container } = draw(
      <Sparkline data={[10, 20]} label="last" format={{ style: "currency", currency: "USD" }} />,
    );
    expect(container.querySelector("text")!.textContent).toBe("$20.00");
  });

  it("renders annotation children inside the svg", () => {
    const { container } = draw(
      <Sparkline data={D}>
        <line data-testid="annot" x1={0} y1={0} x2={80} y2={0} />
      </Sparkline>,
    );
    expect(container.querySelector('[data-testid="annot"]')).not.toBeNull();
  });
});

seriesEdgeSuite("Sparkline", (data) => (
  <Sparkline data={[...data]} label="last" dots="minmax" title="Edge" />
));

describe("<Sparkline> edge inputs", () => {
  it("empty data → no path, 'No data.' summary, no crash", () => {
    const { container } = draw(<Sparkline data={[]} title="Empty" />);
    expect(container.querySelector('[data-mc-ink="data"]')).toBeNull();
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe("Empty. No data.");
  });

  it("single point → dot, no line path move-only is fine", () => {
    const { container } = draw(<Sparkline data={[5]} />);
    expect(container.querySelectorAll("circle")).toHaveLength(1);
  });

  it("all-null → no marks", () => {
    const { container } = draw(<Sparkline data={[null, null]} />);
    expect(container.querySelectorAll("circle")).toHaveLength(0);
  });
});

describe("<Sparkline> a11y (axe, )", () => {
  it("informative chart is axe-clean", async () => {
    const { container } = draw(<Sparkline data={D} title="Weekly revenue" />);
    await expectNoA11yViolations(container);
  });

  it("decorative chart is axe-clean", async () => {
    const { container } = draw(<Sparkline data={D} summary={false} />);
    await expectNoA11yViolations(container);
  });
});

describe("containment", () => {
  it("label='last' reserves a gutter — text start + estimated width stays inside", () => {
    const { container } = render(
      <Sparkline data={[3, 5, 4, 8, 6, 1284]} width={80} height={20} label="last" />,
    );
    const text = container.querySelector("text")!;
    const x = Number(text.getAttribute("x"));
    const fontSize = Number(text.getAttribute("fontSize") ?? text.getAttribute("font-size"));
    const estimated = text.textContent!.length * fontSize * 0.62;
    expect(x + estimated).toBeLessThanOrEqual(80);
    // label y is clamped so the glyph box stays inside too. `dominant-baseline:
    // central` straddles y by HALF a font each way — the same 0.5 model
    // `labelFitsY` and the craft audit use, so this agrees with the gate.
    const y = Number(text.getAttribute("y"));
    expect(y - fontSize * 0.5).toBeGreaterThanOrEqual(0);
    expect(y + fontSize * 0.5).toBeLessThanOrEqual(20);
  });

  it("minmax labels + estimated extents stay inside the viewBox", () => {
    const { container } = render(
      <Sparkline data={[3, 1284, 4, -917, 6]} width={80} height={36} label="minmax" />,
    );
    const labels = [...container.querySelectorAll('text[data-mc-ink="label"]')];
    expect(labels.length).toBe(2);
    for (const text of labels) {
      const x = Number(text.getAttribute("x"));
      const fontSize = Number(text.getAttribute("fontSize") ?? text.getAttribute("font-size"));
      const half = (text.textContent!.length * fontSize * 0.62) / 2;
      expect(x - half).toBeGreaterThanOrEqual(0);
      expect(x + half).toBeLessThanOrEqual(80);
      // `central` — same half-em model as `labelFitsY` / craft.
      const y = Number(text.getAttribute("y"));
      expect(text.getAttribute("dominant-baseline")).toBe("central");
      expect(y - fontSize * 0.5).toBeGreaterThanOrEqual(0);
      expect(y + fontSize * 0.5).toBeLessThanOrEqual(36);
    }
  });

  it("all path/mark coordinates stay inside the viewBox with label gutter active", () => {
    const { container } = render(
      <Sparkline data={[1, 9, 2, 8, 3]} width={60} height={16} label="last" dots="minmax" />,
    );
    for (const c of container.querySelectorAll("circle")) {
      expect(Number(c.getAttribute("cx"))).toBeLessThanOrEqual(60);
      expect(Number(c.getAttribute("cy"))).toBeLessThanOrEqual(16);
    }
  });
});

// Degradation contract (tests/craft/floor.mjs): a label the box can no longer
// seat is DROPPED — never painted outside the viewBox — the reserved gutter
// goes with it, and the line still renders.
describe("Sparkline degradation", () => {
  it("the endpoint readout drops below its own font, the line still draws", () => {
    const big = render(<Sparkline data={D} label="last" width={220} height={32} />).container;
    expect(big.querySelector("text")).not.toBeNull();

    // `labelMetrics` floors the figure at 6 units on a short box, so a 5-unit
    // box cannot seat it at all.
    const small = render(<Sparkline data={D} label="last" width={44} height={5} />).container;
    expect(small.querySelector("text")).toBeNull();
    expect(small.querySelector("path[data-mc-ink='data']")).not.toBeNull();
    // the gutter went with the label: the line reaches the full width
    const d = small.querySelector("path[data-mc-ink='data']")!.getAttribute("d")!;
    const xs = [...d.matchAll(/[ML](-?[\d.]+)/g)].map((m) => Number(m[1]));
    expect(Math.max(...xs)).toBeGreaterThan(40);
  });
});
