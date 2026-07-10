import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { HistogramStrip } from "./index.js";
import { expectNoA11yViolations } from "../../test/a11y.js";
import { seriesEdgeSuite } from "../../test/edge-cases.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);

// 120 values clustered between 40 and 50
const TIMES = Array.from({ length: 120 }, (_, i) =>
  i % 3 === 0 ? 40 + (i % 10) : 20 + ((i * 7) % 60),
);

describe("<HistogramStrip> (plan/22 #15, S1 distribution)", () => {
  it("bars per bin; docs-as-tests summary names the modal bin", () => {
    const { container } = draw(<HistogramStrip data={TIMES} />);
    expect(container.querySelectorAll("rect").length).toBeGreaterThan(3);
    const label = container.querySelector("svg")!.getAttribute("aria-label")!;
    expect(label).toMatch(/^120 values, most between \d+(\.\d+)? and \d+(\.\d+)?\.$/);
  });

  it("markValue accents one bin, mutes the rest", () => {
    const { container } = draw(<HistogramStrip data={TIMES} markValue={45} />);
    const accent = [...container.querySelectorAll("rect")].filter(
      (r) => (r as SVGElement).style.fill === "var(--mc-accent)",
    );
    expect(accent.length).toBe(1);
    const muted = [...container.querySelectorAll("rect")].filter(
      (r) => (r as SVGElement).style.fillOpacity === "0.55",
    );
    expect(muted.length).toBeGreaterThan(0);
  });

  it("all-equal data → a single full-height bin", () => {
    const { container } = draw(<HistogramStrip data={[4, 4, 4, 4, 4]} />);
    expect(container.querySelectorAll("rect").length).toBe(1);
  });

  it("is axe-clean", async () => {
    const { container } = draw(<HistogramStrip data={TIMES} title="Response times" />);
    await expectNoA11yViolations(container);
  });
});

seriesEdgeSuite("HistogramStrip", (data) => <HistogramStrip data={data} title="Edge" />);
