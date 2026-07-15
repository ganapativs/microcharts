import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { PercentileTrace } from "./index.js";
import { expectNoA11yViolations } from "../../test/a11y.js";
import { expectHostsAnnotations } from "../../test/annotation-host.js";
import { seriesEdgeSuite } from "../../test/edge-cases.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);
// a standing that climbs from the middle half up above it
const SAMPLE = [42, 48, 55, 61, 68, 74, 79, 81];

describe("<PercentileTrace>", () => {
  it("summary states current percentile, change, and band crossed — the real string", () => {
    const { container } = draw(<PercentileTrace data={SAMPLE} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "p81 now, up 39 points from the first reading; moved above the middle half.",
    );
  });

  it("a flat, mid-band series reads held-within, unchanged", () => {
    const { container } = draw(<PercentileTrace data={[50, 50, 50]} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "p50 now, unchanged from the first reading; held within the middle half.",
    );
  });

  it("draws two population bands + a single trace + endpoint dot", () => {
    const { container } = draw(<PercentileTrace data={SAMPLE} />);
    expect(container.querySelectorAll('rect[data-mc-ink="band"]').length).toBe(2);
    expect(container.querySelectorAll('path[data-mc-ink="data"]').length).toBe(1);
    expect(container.querySelectorAll("circle").length).toBe(1);
  });

  it("bands={false} hides the population fields", () => {
    const { container } = draw(<PercentileTrace data={SAMPLE} bands={false} />);
    expect(container.querySelector("rect")).toBeNull();
  });

  it("endpoint dot carries valence: rising is positive, falling is negative", () => {
    const up = draw(<PercentileTrace data={SAMPLE} />).container.querySelector("circle")!;
    const down = draw(<PercentileTrace data={[80, 60, 40, 20]} />).container.querySelector(
      "circle",
    )!;
    expect(up.getAttribute("style")).toContain("--mc-positive");
    expect(down.getAttribute("style")).toContain("--mc-negative");
  });

  it("positive='down' flips the valence — a fall is good", () => {
    const dot = draw(
      <PercentileTrace data={[80, 60, 40, 20]} positive="down" />,
    ).container.querySelector("circle")!;
    expect(dot.getAttribute("style")).toContain("--mc-positive");
  });

  it("label='last' states the final percentile; 'none' shows no text", () => {
    const labeled = draw(<PercentileTrace data={SAMPLE} />).container;
    const none = draw(<PercentileTrace data={SAMPLE} label="none" />).container;
    expect(labeled.querySelector("text")!.textContent).toBe("p81");
    expect(none.querySelector("text")).toBeNull();
  });

  it("is axe-clean", async () => {
    const { container } = draw(<PercentileTrace data={SAMPLE} title="W12 percentile" />);
    await expectNoA11yViolations(container);
  });

  it("hosts annotations (marks drawn + clamped in frame)", () => {
    expectHostsAnnotations(
      (children) => (
        <PercentileTrace data={SAMPLE} width={80} height={20} label="none" summary={false}>
          {children}
        </PercentileTrace>
      ),
      80,
      20,
    );
  });
});

seriesEdgeSuite("PercentileTrace", (data) => (
  <PercentileTrace data={data as number[]} title="Edge" />
));
