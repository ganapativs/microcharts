import { describe, it, expect, vi, afterEach } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { BiasStrip } from "./index.js";
import { expectNoA11yViolations } from "../../test/a11y.js";
import { mappedEdgeSuite } from "../../test/edge-cases.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);

// a clean +2 systematic offset (b runs 2 below a) — 12 pairs, band + limits
const OFFSET = Array.from({ length: 12 }, (_, i) => ({ a: i + 2, b: i }));

// realistic docs dataset: a ~+2 bias with noise and two pairs beyond the limits
const DIFFS = [
  1.8, 2.4, 1.5, 2.9, 2.1, 1.2, 2.6, 3.0, 1.9, 2.3, 6.5, 2.0, 1.7, 2.8, 2.2, -1.5, 2.5, 1.6, 2.7,
  2.0,
];
const MEASURED = DIFFS.map((d, i) => ({ a: i + d, b: i }));

afterEach(() => {
  vi.restoreAllMocks();
});

describe("<BiasStrip>", () => {
  it("dots at 75% opacity; summary reports bias and within-limits share", () => {
    const { container } = draw(<BiasStrip data={OFFSET} />);
    const dot = container.querySelector('circle[data-mc-ink="point"]')!;
    expect(dot.getAttribute("fill-opacity")).toBe("0.75");
    const label = container.querySelector("svg")!.getAttribute("aria-label")!;
    expect(label).toMatch(/^Bias \+2 across 12 pairs; \d+% within the limits of agreement\.$/);
  });

  it("renders the limits band and the accent bias line at n ≥ 5", () => {
    const { container } = draw(<BiasStrip data={OFFSET} />);
    expect(container.querySelector('rect[data-mc-ink="band"]')).not.toBeNull();
    expect(container.querySelector('line[data-mc-ink="accent"]')).not.toBeNull();
  });

  it("fewer than 5 pairs → dots only, count summary, no band", () => {
    const { container } = draw(<BiasStrip data={OFFSET.slice(0, 4)} />);
    expect(container.querySelector('rect[data-mc-ink="band"]')).toBeNull();
    expect(container.querySelector('line[data-mc-ink="accent"]')).toBeNull();
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "Bias +2 across 4 pairs.",
    );
  });

  it("a pair beyond the limits is re-inked negative and enlarged (shape, not color-alone)", () => {
    const { container } = draw(<BiasStrip data={MEASURED} />);
    const outlier = container.querySelector('circle[data-mc-ink="negative"]')!;
    expect(outlier).not.toBeNull();
    expect(Number(outlier.getAttribute("r"))).toBeGreaterThan(1.5);
  });

  it("bias caption seats when it fits, drops out when it cannot", () => {
    const wide = draw(<BiasStrip data={OFFSET} width={120} height={44} />);
    expect(wide.container.querySelector("text")?.textContent).toMatch(/bias/);
    const tiny = draw(<BiasStrip data={OFFSET} width={28} height={16} />);
    expect(tiny.container.querySelector("text")).toBeNull();
  });

  it("caption seats in a reserved top gutter, never on a dot (56x30 regression)", () => {
    // at 56x30 with a scattered cloud the bias caption used to land ON the dots;
    // it now sits in a reserved top gutter with the plot compressed below it.
    const { container } = draw(<BiasStrip data={MEASURED} width={56} height={30} />);
    const text = container.querySelector("text")!;
    expect(text).not.toBeNull();
    const fs = Number(text.getAttribute("font-size"));
    const y = Number(text.getAttribute("y"));
    const capTop = y - fs * 0.5; // central-baseline box (matches the craft gate)
    const capBottom = y + fs * 0.5;
    const dots = [...container.querySelectorAll("circle")];
    expect(dots.length).toBeGreaterThan(0);
    const topDotEdge = Math.min(
      ...dots.map((c) => Number(c.getAttribute("cy")) - Number(c.getAttribute("r"))),
    );
    expect(capBottom).toBeLessThanOrEqual(topDotEdge); // no text-on-mark collision
    expect(capTop).toBeGreaterThanOrEqual(-0.3); // stays inside the viewBox
  });

  it('label="none" hides the caption', () => {
    const { container } = draw(<BiasStrip data={OFFSET} width={120} height={44} label="none" />);
    expect(container.querySelector("text")).toBeNull();
  });

  it("> 40 pairs → dev warning (downsample cap)", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    draw(<BiasStrip data={Array.from({ length: 41 }, (_, i) => ({ a: i + 1, b: i }))} />);
    expect(warn).toHaveBeenCalledOnce();
  });

  it("is axe-clean", async () => {
    const { container } = draw(<BiasStrip data={MEASURED} title="Device vs reference" />);
    await expectNoA11yViolations(container);
  });
});

// Both members of the pair are encoded — x is (a+b)/2 and y is a−b, so each
// reaches both axes. The previous spelling pinned `b: i`, so a degenerate
// reference measurement never met the chart at all and only half the pair's
// guard was ever exercised. One suite per member keeps the other finite, so a
// broken half can't hide behind its neighbour and every matrix value reaches
// every field. `label="bias"` at a box that seats it: the caption is where a
// numeral leak would surface.
const biasCase = (data: readonly { a: number; b: number }[]) => (
  <BiasStrip data={data} title="Edge" width={120} height={44} label="bias" />
);
mappedEdgeSuite("BiasStrip (degenerate a)", (v, i) => ({ a: v as number, b: i }), biasCase);
mappedEdgeSuite("BiasStrip (degenerate b)", (v, i) => ({ a: i, b: v as number }), biasCase);
