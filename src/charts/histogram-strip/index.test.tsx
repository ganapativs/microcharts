import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { HistogramStrip } from "./index.js";
import { expectNoA11yViolations } from "../../test/a11y.js";
import { seriesEdgeSuite } from "../../test/edge-cases.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);
const labelOf = (c: HTMLElement) => c.querySelector("svg")!.getAttribute("aria-label")!;

// 120 values clustered between 40 and 50
const TIMES = Array.from({ length: 120 }, (_, i) =>
  i % 3 === 0 ? 40 + (i % 10) : 20 + ((i * 7) % 60),
);

describe("<HistogramStrip>", () => {
  it("bars per bin summary names the modal bin", () => {
    const { container } = draw(<HistogramStrip data={TIMES} />);
    expect(container.querySelectorAll("rect").length).toBeGreaterThan(3);
    const label = container.querySelector("svg")!.getAttribute("aria-label")!;
    expect(label).toMatch(/^120 values, most between \d+(\.\d+)? and \d+(\.\d+)?\.$/);
  });

  it("markValue accents one bin, mutes the rest", () => {
    const { container } = draw(<HistogramStrip data={TIMES} markValue={45} />);
    // The ink ROLE carries the accent, not an inline fill: `.mc-root` sets
    // `forced-color-adjust: none`, so an inline `fill: var(--mc-accent)` would
    // survive into High Contrast Mode and never map to Highlight.
    const accent = container.querySelectorAll('rect[data-mc-ink="accent"]');
    expect(accent.length).toBe(1);
    expect((accent[0] as SVGElement).style.fill).toBe("");
    const muted = [...container.querySelectorAll("rect")].filter(
      (r) => (r as SVGElement).style.fillOpacity === "0.55",
    );
    expect(muted.length).toBeGreaterThan(0);
  });

  it("no markValue → every bin is plain bar ink", () => {
    const { container } = draw(<HistogramStrip data={TIMES} />);
    expect(container.querySelectorAll('rect[data-mc-ink="accent"]').length).toBe(0);
    expect(container.querySelectorAll('rect[data-mc-ink="bar"]').length).toBeGreaterThan(3);
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

// Hostile CONFIG, not hostile data: a host computes `domain` with a Math.min
// over a series holding a NaN, and `bins` off an empty input field. Both used
// to render a plausible-looking chart under a broken accessible name.
describe("<HistogramStrip> hostile config", () => {
  for (const [name, domain] of [
    ["both ends NaN", [NaN, NaN]],
    ["one end NaN", [0, NaN]],
    ["unbounded", [0, Infinity]],
  ] as const) {
    it(`non-finite domain (${name}) falls back to the data extent`, () => {
      const { container } = draw(<HistogramStrip data={TIMES} domain={domain} />);
      expect(labelOf(container)).toBe(labelOf(draw(<HistogramStrip data={TIMES} />).container));
      expect(container.querySelectorAll("rect").length).toBeGreaterThan(3);
    });
  }

  for (const [name, bins] of [
    ["NaN", NaN],
    ["Infinity", Infinity],
  ] as const) {
    it(`non-finite bins (${name}) falls back to auto, never "No data."`, () => {
      const { container } = draw(<HistogramStrip data={TIMES} bins={bins} />);
      expect(labelOf(container)).toBe(labelOf(draw(<HistogramStrip data={TIMES} />).container));
      expect(container.querySelectorAll("rect").length).toBeGreaterThan(3);
    });
  }

  it("a finite domain is still honored exactly", () => {
    const { container } = draw(<HistogramStrip data={TIMES} domain={[0, 100]} />);
    expect(labelOf(container)).toMatch(/^120 values, most between \d+(\.\d+)? and \d+(\.\d+)?\.$/);
  });
});

seriesEdgeSuite("HistogramStrip", (data) => <HistogramStrip data={data} title="Edge" />);
