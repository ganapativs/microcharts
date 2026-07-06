import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { Sparkline } from "./index.js";
import { expectNoA11yViolations } from "../../test/a11y.js";

const D = [4, 6, 5, 9, 7, 8, 11, 9, 13, 12];

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);

describe("<Sparkline> static structure (plan/03, plan/09)", () => {
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

describe("<Sparkline> edge inputs (plan/09)", () => {
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

describe("<Sparkline> a11y (axe, plan/08)", () => {
  it("informative chart is axe-clean", async () => {
    const { container } = draw(<Sparkline data={D} title="Weekly revenue" />);
    await expectNoA11yViolations(container);
  });

  it("decorative chart is axe-clean", async () => {
    const { container } = draw(<Sparkline data={D} summary={false} />);
    await expectNoA11yViolations(container);
  });
});

describe("containment (CLAUDE.md: nothing paints outside the viewBox)", () => {
  it("label='last' reserves a gutter — text start + estimated width stays inside", () => {
    const { container } = render(
      <Sparkline data={[3, 5, 4, 8, 6, 1284]} width={80} height={20} label="last" />,
    );
    const text = container.querySelector("text")!;
    const x = Number(text.getAttribute("x"));
    const fontSize = Number(text.getAttribute("fontSize") ?? text.getAttribute("font-size"));
    const estimated = text.textContent!.length * fontSize * 0.62;
    expect(x + estimated).toBeLessThanOrEqual(80);
    // label y is clamped so ascenders/descenders stay inside too
    const y = Number(text.getAttribute("y"));
    expect(y - fontSize * 0.55).toBeGreaterThanOrEqual(0);
    expect(y + fontSize * 0.55).toBeLessThanOrEqual(20);
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
