import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { BenchmarkStrip } from "./index.js";
import { expectNoA11yViolations } from "../../test/a11y.js";
import { seriesEdgeSuite } from "../../test/edge-cases.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);
const PEERS = Array.from({ length: 40 }, (_, i) => i + 1);

describe("<BenchmarkStrip>", () => {
  it("summary states value, percentile, n, and the middle half — the real string", () => {
    const { container } = draw(
      <BenchmarkStrip data={PEERS} value={20} format={{ maximumFractionDigits: 0 }} />,
    );
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "20 — 49th percentile of 40 peers (middle half 11–30).",
    );
  });

  it("small-n summary makes smallness audible", () => {
    const { container } = draw(<BenchmarkStrip data={[1, 2, 3, 4, 5]} value={3} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toContain("of 5 peers");
  });

  it("the percentile reads next to the focal dot (label='none' shows no text)", () => {
    const labeled = draw(<BenchmarkStrip data={PEERS} value={20} label="percentile" />).container;
    const none = draw(<BenchmarkStrip data={PEERS} value={20} label="none" />).container;
    expect(labeled.querySelector("text")!.textContent).toBe("p49");
    expect(none.querySelector("text")).toBeNull();
  });

  it("positive polarity colors the focal dot by which side of the band is good", () => {
    const up = draw(<BenchmarkStrip data={PEERS} value={38} positive="up" />).container;
    const down = draw(<BenchmarkStrip data={PEERS} value={38} positive="down" />).container;
    // The valence rides an inline style, not a `fill` attribute: an attribute
    // loses to the dot's own ink role, and the role is what carries the mark
    // into the data-change transition.
    expect(up.querySelector("circle")!.getAttribute("style")).toContain("--mc-positive");
    expect(down.querySelector("circle")!.getAttribute("style")).toContain("--mc-negative");
  });

  it("label='value' reserves the gutter its own text needs, clearing the plot box", () => {
    const peers = [-1e6, -2e6, -3e6, -4e6, -5e6, -6e6, -7e6, -8e6];
    const { container } = draw(
      <BenchmarkStrip data={peers} value={-1234567.89} label="value" width={80} height={12} />,
    );
    const text = container.querySelector("text")!;
    const vbWidth = Number(container.querySelector("svg")!.getAttribute("viewBox")!.split(" ")[2]);
    // text-anchor="end" pins the run's right edge at the viewBox edge, so it
    // grows leftwards; at a fixed 4-char gutter it reached back over the bands
    // and painted across the focal dot. `textGutter`'s own 0.62/char estimate.
    const fontSize = Number(text.getAttribute("font-size"));
    const runLeft = vbWidth - [...text.textContent!].length * fontSize * 0.62;
    expect(runLeft).toBeGreaterThanOrEqual(80);
  });

  it("the percentile gutter is fixed, so the box holds still as the reading moves", () => {
    const box = (v: number) =>
      draw(<BenchmarkStrip data={PEERS} value={v} />)
        .container.querySelector("svg")!
        .getAttribute("viewBox");
    expect(box(1)).toBe(box(40));
  });

  it("is axe-clean", async () => {
    const { container } = draw(<BenchmarkStrip data={PEERS} value={20} title="Latency vs peers" />);
    await expectNoA11yViolations(container);
  });

  // Degradation contract: see tests/craft/floor.mjs.
  it("short box: the percentile readout drops, band + focal dot still render", () => {
    const peers = [120, 135, 128, 480, 142, 2100, 155, 138, 900, 148];
    const big = draw(<BenchmarkStrip data={peers} value={155} width={160} height={16} />).container;
    expect(big.querySelector("text")).not.toBeNull();

    // labelFont floors at 7 viewBox units — a 6-unit box cannot seat a line
    const small = draw(<BenchmarkStrip data={peers} value={155} width={56} height={6} />).container;
    expect(small.querySelector("text")).toBeNull();
    expect(small.querySelectorAll("rect").length).toBeGreaterThanOrEqual(2);
    expect(small.querySelector("circle")).not.toBeNull();
    // the gutter went with the label: no extra width reserved for absent text
    expect(small.querySelector("svg")!.getAttribute("viewBox")).toBe("0 0 56 6");
  });
});

seriesEdgeSuite("BenchmarkStrip", (data) => <BenchmarkStrip data={data} value={5} title="Edge" />);
