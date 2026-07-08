import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { GradedBand } from "./index.js";
import { expectNoA11yViolations } from "../../test/a11y.js";
import { seriesEdgeSuite } from "../../test/edge-cases.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);
const SAMPLE = Array.from({ length: 101 }, (_, i) => i);

describe("<GradedBand> (plan/23 #4, S1)", () => {
  it("summary states median + innermost and outermost intervals — the real string", () => {
    const { container } = draw(<GradedBand data={SAMPLE} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "Median 50; 50% within 25–75, 95% within 2.5–97.5.",
    );
  });

  it("one rect per level + median tick (no bar from zero)", () => {
    const { container } = draw(<GradedBand data={SAMPLE} />);
    const rects = container.querySelectorAll("rect");
    expect(rects.length).toBe(3);
    // the outer band does NOT start at x=0 — this is never a bar from the origin
    expect(Number(rects[0]!.getAttribute("x"))).toBeGreaterThan(0);
    expect(container.querySelectorAll("line").length).toBe(1); // median tick
  });

  it("softEdge adds a fainter halo behind the outer band", () => {
    const hard = draw(<GradedBand data={SAMPLE} />).container;
    const soft = draw(<GradedBand data={SAMPLE} softEdge />).container;
    expect(soft.querySelectorAll("rect").length).toBeGreaterThan(
      hard.querySelectorAll("rect").length,
    );
  });

  it("label='median' widens the viewBox for a gutter value", () => {
    const plain = draw(<GradedBand data={SAMPLE} />).container;
    const labeled = draw(<GradedBand data={SAMPLE} label="median" />).container;
    const wPlain = Number(plain.querySelector("svg")!.getAttribute("viewBox")!.split(" ")[2]);
    const wLabeled = Number(labeled.querySelector("svg")!.getAttribute("viewBox")!.split(" ")[2]);
    expect(wLabeled).toBeGreaterThan(wPlain);
    expect(labeled.querySelector("text")!.textContent).toBe("50");
  });

  it("is axe-clean", async () => {
    const { container } = draw(<GradedBand data={SAMPLE} title="Forecast estimate" />);
    await expectNoA11yViolations(container);
  });
});

seriesEdgeSuite("GradedBand", (data) => <GradedBand data={data} title="Edge" />);
