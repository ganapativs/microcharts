import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { QuadrantDot } from "./index.js";
import { expectNoA11yViolations } from "../../test/a11y.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);
const FIELD = [
  { x: 2, y: 8 },
  { x: 8, y: 9 },
  { x: 3, y: 7 },
  { x: 9, y: 2 },
  { x: 7, y: 3 },
  { x: 1, y: 1 },
];

describe("<QuadrantDot>", () => {
  it("summary names position, the axis-relative quadrant, and peers — the real string", () => {
    const { container } = draw(
      <QuadrantDot
        data={{ x: 3, y: 9 }}
        field={FIELD}
        xDomain={[1, 9]}
        domain={[1, 9]}
        split={[5, 5]}
        xLabel="effort"
        yLabel="impact"
      />,
    );
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "Impact 9, effort 3 — in the high-impact, low-effort quadrant (2 of 6 peers).",
    );
  });

  it("explicit quadrant names win over the generated wording", () => {
    const { container } = draw(
      <QuadrantDot
        data={{ x: 3, y: 9 }}
        field={FIELD}
        split={[5, 5]}
        quadrants={["quick win", "big bet", "skip", "time sink"]}
      />,
    );
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toContain(
      "in the quick win quadrant",
    );
  });

  it("no field → lone-glyph summary, no peers clause", () => {
    const { container } = draw(
      <QuadrantDot
        data={{ x: 3, y: 9 }}
        xDomain={[1, 9]}
        domain={[1, 9]}
        split={[5, 5]}
        xLabel="effort"
        yLabel="impact"
      />,
    );
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "Impact 9, effort 3 — in the high-impact, low-effort quadrant.",
    );
  });

  it("renders a cross, a focal dot, and one ghost per peer", () => {
    const { container } = draw(<QuadrantDot data={{ x: 3, y: 9 }} field={FIELD} />);
    expect(container.querySelectorAll("line").length).toBe(2); // both split axes
    expect(container.querySelectorAll('circle[data-mc-ink="ghost"]').length).toBe(6);
    expect(container.querySelector('circle[data-mc-ink="data"]')).not.toBeNull();
  });

  it("region tint on by default, off with region={false}", () => {
    const on = draw(<QuadrantDot data={{ x: 3, y: 9 }} field={FIELD} />).container;
    const off = draw(<QuadrantDot data={{ x: 3, y: 9 }} field={FIELD} region={false} />).container;
    expect(on.querySelector('rect[data-mc-ink="region"]')).not.toBeNull();
    expect(off.querySelector('rect[data-mc-ink="region"]')).toBeNull();
  });

  it("no in-chart text at glyph scale", () => {
    const { container } = draw(<QuadrantDot data={{ x: 3, y: 9 }} field={FIELD} />);
    expect(container.querySelector("text")).toBeNull();
  });

  // Hostile CONFIG, at the markup boundary: a NaN reaching an attribute makes
  // the browser drop it, so the chart renders at the wrong scale (or not at
  // all) behind an accessible name that still sounds right.
  it("never emits a non-finite coordinate for a hostile domain, split, or box", () => {
    const hostile = [
      <QuadrantDot key="xd" data={{ x: 3, y: 9 }} field={FIELD} xDomain={[NaN, 10]} />,
      <QuadrantDot key="yd" data={{ x: 3, y: 9 }} field={FIELD} domain={[0, NaN]} />,
      <QuadrantDot key="xi" data={{ x: 3, y: 9 }} field={FIELD} xDomain={[-Infinity, 10]} />,
      <QuadrantDot key="sn" data={{ x: 3, y: 9 }} field={FIELD} split={[NaN, 5]} />,
      <QuadrantDot key="si" data={{ x: 3, y: 9 }} field={FIELD} split={[Infinity, 5]} />,
      <QuadrantDot key="w" data={{ x: 3, y: 9 }} field={FIELD} width={NaN} />,
      <QuadrantDot key="h" data={{ x: 3, y: 9 }} field={FIELD} height={NaN} />,
    ];
    for (const ui of hostile) {
      const { container } = draw(ui);
      for (const el of container.querySelectorAll("svg *")) {
        for (const attr of el.attributes) {
          expect(attr.value, `${el.tagName}.${attr.name}`).not.toMatch(/NaN|Infinity/);
        }
      }
      expect(container.querySelector("svg")!.getAttribute("viewBox")).not.toMatch(/NaN|Infinity/);
    }
  });

  it("a split outside the domain keeps the tint inside the viewBox", () => {
    const { container } = draw(
      <QuadrantDot
        data={{ x: 3, y: 9 }}
        field={FIELD}
        xDomain={[0, 10]}
        domain={[0, 10]}
        split={[20, 5]}
      />,
    );
    const rect = container.querySelector('rect[data-mc-ink="region"]')!;
    const x = Number(rect.getAttribute("x"));
    const w = Number(rect.getAttribute("width"));
    expect(x).toBeGreaterThanOrEqual(0);
    expect(x + w).toBeLessThanOrEqual(24);
  });

  // Two items with the same score is the ordinary case, not the hostile one:
  // a value-derived key collided and React dropped one of the tied dots.
  it("paints one ghost per peer even when peers are tied", () => {
    const tied = [
      { x: 2, y: 8 },
      { x: 2, y: 8 },
      { x: 5, y: 5 },
    ];
    const { container } = draw(<QuadrantDot data={{ x: 3, y: 9 }} field={tied} />);
    expect(container.querySelectorAll('circle[data-mc-ink="ghost"]').length).toBe(3);
  });

  it("is axe-clean", async () => {
    const { container } = draw(
      <QuadrantDot data={{ x: 3, y: 9 }} field={FIELD} title="Effort vs impact" />,
    );
    await expectNoA11yViolations(container);
  });
});
