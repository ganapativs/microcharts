import { describe, it, expect, vi, afterEach } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { MicroBox } from "./index.js";
import { expectNoA11yViolations } from "../../test/a11y.js";
import { seriesEdgeSuite } from "../../test/edge-cases.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);

const RAW = [12, 30, 35, 38, 42, 45, 48, 51, 60, 96];

afterEach(() => {
  vi.restoreAllMocks();
});

describe("<MicroBox>", () => {
  it("whisker + IQR box + median tick summary", () => {
    const { container } = draw(
      <MicroBox stats={{ min: 12, q1: 35, median: 42, q3: 51, max: 96 }} />,
    );
    expect(container.querySelectorAll("line").length).toBe(2); // whisker + median
    expect(container.querySelector("rect")).not.toBeNull();
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "Median 42, middle half 35 to 51, range 12 to 96.",
    );
  });

  it("raw data path computes the five numbers", () => {
    const { container } = draw(<MicroBox data={RAW} />);
    expect(container.querySelector("rect")).not.toBeNull();
  });

  it("< 5 raw observations → dots at raw values, never a fake box", () => {
    const { container } = draw(<MicroBox data={[3, 7, 9]} />);
    expect(container.querySelector("rect")).toBeNull();
    expect(container.querySelectorAll("circle").length).toBe(3);
  });

  it("non-monotonic stats → dev warning + no plausible-looking render", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { container } = draw(<MicroBox stats={{ min: 5, q1: 3, median: 4, q3: 6, max: 7 }} />);
    expect(container.querySelector("rect")).toBeNull();
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe("No data.");
    expect(warn).toHaveBeenCalled();
  });

  it("tukey renders outlier dots", () => {
    const { container } = draw(<MicroBox data={[...RAW, 400]} whiskers="tukey" />);
    expect(container.querySelectorAll("circle").length).toBeGreaterThan(0);
  });

  it("is axe-clean", async () => {
    const { container } = draw(<MicroBox data={RAW} title="p95 latency" />);
    await expectNoA11yViolations(container);
  });
});

seriesEdgeSuite("MicroBox", (data) => <MicroBox data={data} title="Edge" />);
