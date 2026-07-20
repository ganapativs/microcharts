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
    expect(up.querySelector("circle")!.getAttribute("fill")).toContain("--mc-positive");
    expect(down.querySelector("circle")!.getAttribute("fill")).toContain("--mc-negative");
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
