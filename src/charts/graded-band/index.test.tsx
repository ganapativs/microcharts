import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { GradedBand } from "./index.js";
import { expectNoA11yViolations } from "../../test/a11y.js";
import { seriesEdgeSuite } from "../../test/edge-cases.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);
const SAMPLE = Array.from({ length: 101 }, (_, i) => i);

describe("<GradedBand>", () => {
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

  it("an unusable `levels` still describes the data, never 'No data.'", () => {
    const { container } = draw(<GradedBand data={SAMPLE} levels={[]} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "Median 50; 50% within 25–75, 95% within 2.5–97.5.",
    );
    expect(container.querySelectorAll("rect").length).toBe(3);
  });

  it("bands paint through the shared cone role, not an inline fill", () => {
    // `.mc-root` sets `forced-color-adjust: none`, so an inline `fill` reaches
    // High Contrast Mode verbatim — a 14%-opacity accent is not a visible
    // interval there. styles.css owns the fill; the chart sets the vars.
    const { container } = draw(<GradedBand data={SAMPLE} />);
    const bands = [...container.querySelectorAll("rect")];
    expect(bands.map((r) => r.getAttribute("data-mc-cone"))).toEqual(["95", "80", "50"]);
    for (const r of bands) {
      expect(r.style.fill).toBe("");
      expect(r.style.getPropertyValue("--mc-cone-color")).toBe("var(--mc-accent)");
    }
    // opacity still grades widest → faintest, narrowest → strongest
    const op = bands.map((r) => Number(r.style.getPropertyValue("--mc-cone-opacity")));
    expect(op[0]).toBeLessThan(op[1]!);
    expect(op[1]).toBeLessThan(op[2]!);
  });

  it("`color` reaches the bands as the cone color", () => {
    const { container } = draw(<GradedBand data={SAMPLE} color="#123456" />);
    const band = container.querySelector("rect")!;
    expect(band.style.getPropertyValue("--mc-cone-color")).toBe("#123456");
  });

  it("softEdge adds a fainter halo behind the outer band", () => {
    const hard = draw(<GradedBand data={SAMPLE} />).container;
    const soft = draw(<GradedBand data={SAMPLE} softEdge />).container;
    expect(soft.querySelectorAll("rect").length).toBeGreaterThan(
      hard.querySelectorAll("rect").length,
    );
  });

  it("label='median' states the median in the right gutter (none shows no text)", () => {
    const labeled = draw(<GradedBand data={SAMPLE} label="median" width={80} />).container;
    const none = draw(<GradedBand data={SAMPLE} />).container;
    const t = labeled.querySelector("text")!;
    expect(t.textContent).toBe("50");
    expect(t.getAttribute("text-anchor")).toBe("end");
    expect(Number(t.getAttribute("x"))).toBeGreaterThan(80);
    // the label ink role carries the forced-colors CanvasText mapping; without
    // it the readout kept a fixed `--mc-stroke` hex into High Contrast Mode
    expect(t.getAttribute("data-mc-ink")).toBe("label");
    // tabular-nums comes from styles.css — inline puts it out of a consumer's reach
    expect(t.style.fontVariantNumeric).toBe("");
    expect(none.querySelector("text")).toBeNull();
  });

  it("is axe-clean", async () => {
    const { container } = draw(<GradedBand data={SAMPLE} title="Forecast estimate" />);
    await expectNoA11yViolations(container);
  });

  // Degradation contract: see tests/craft/floor.mjs.
  it("short box: the median readout drops, the graded bands still render", () => {
    const draws = [120, 135, 128, 480, 142, 2100, 155, 138, 900, 148];
    const big = draw(<GradedBand data={draws} label="median" width={160} height={16} />).container;
    expect(big.querySelector("text")).not.toBeNull();

    // labelFont floors at 7 viewBox units — a 6-unit box cannot seat a line
    const small = draw(<GradedBand data={draws} label="median" width={56} height={6} />).container;
    expect(small.querySelector("text")).toBeNull();
    expect(small.querySelectorAll("rect").length).toBeGreaterThanOrEqual(1);
    expect(small.querySelector("line")).not.toBeNull(); // median tick survives
  });
});

seriesEdgeSuite("GradedBand", (data) => <GradedBand data={data} title="Edge" />);
