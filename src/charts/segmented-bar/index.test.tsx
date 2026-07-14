import { describe, it, expect, vi, afterEach } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { SegmentedBar } from "./index.js";
import { expectNoA11yViolations } from "../../test/a11y.js";
import { seriesEdgeSuite } from "../../test/edge-cases.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);

const MIX = [
  { label: "Chrome", value: 620 },
  { label: "Safari", value: 240 },
  { label: "Firefox", value: 90 },
  { label: "Edge", value: 30 },
  { label: "Arc", value: 12 },
  { label: "Brave", value: 8 },
];

afterEach(() => {
  vi.restoreAllMocks();
});

describe("<SegmentedBar>", () => {
  it("≤ 5 segments with an Other rollup summary", () => {
    const { container } = draw(<SegmentedBar data={MIX} />);
    expect(container.querySelectorAll("rect").length).toBe(5);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "Chrome 62%, Safari 24%, Firefox 9%, Edge 3%, Other 2%.",
    );
  });

  it("percents use largest-remainder rounding (sum = 100)", () => {
    const { container } = draw(
      <SegmentedBar
        data={[
          { label: "a", value: 1 },
          { label: "b", value: 1 },
          { label: "c", value: 1 },
        ]}
        label="percent"
        width={120}
        height={12}
      />,
    );
    const pcts = [...container.querySelectorAll("text")].map((t) =>
      Number(t.textContent!.replace("%", "")),
    );
    expect(pcts.reduce((a, b) => a + b, 0)).toBe(100);
  });

  it("negative values are excluded + dev warning", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { container } = draw(
      <SegmentedBar
        data={[
          { label: "a", value: 10 },
          { label: "bad", value: -4 },
        ]}
      />,
    );
    expect(container.querySelectorAll("rect").length).toBe(1);
    expect(warn).toHaveBeenCalled();
  });

  it("order='desc' ranks; Other stays last", () => {
    const { container } = draw(<SegmentedBar data={MIX} order="desc" />);
    const widths = [...container.querySelectorAll("rect")].map((r) =>
      Number(r.getAttribute("width")),
    );
    // first four descending
    for (let i = 1; i < 4; i++) expect(widths[i]!).toBeLessThanOrEqual(widths[i - 1]!);
  });

  it("segment labels drop deterministically when they can't fit", () => {
    const { container } = draw(<SegmentedBar data={MIX} label="percent" width={40} />);
    // tiny segments (3%, 2%) cannot carry text at width 40
    expect(container.querySelectorAll("text").length).toBeLessThan(5);
  });

  it("is axe-clean", async () => {
    const { container } = draw(<SegmentedBar data={MIX.slice(0, 3)} title="Browser share" />);
    await expectNoA11yViolations(container);
  });

  it("colors[] overrides the palette per segment, cycling; Other stays neutral", () => {
    const { container } = draw(
      <SegmentedBar data={MIX} colors={["rgb(1, 2, 3)", "rgb(4, 5, 6)"]} />,
    );
    const rects = [...container.querySelectorAll("rect")] as SVGElement[];
    expect(rects[0]!.style.fill).toBe("rgb(1, 2, 3)");
    expect(rects[1]!.style.fill).toBe("rgb(4, 5, 6)");
    expect(rects[2]!.style.fill).toBe("rgb(1, 2, 3)"); // cycles at length 2
    // categorical attribute is retained (motion selectors + forced-colors rely on it)
    expect(rects[0]!.getAttribute("data-mc-cat")).toBe("1");
    const other = rects[rects.length - 1]!;
    expect(other.getAttribute("data-mc-ink")).toBe("neutral");
    expect(other.style.fill).toBe("");
  });
});

seriesEdgeSuite("SegmentedBar", (data) => (
  <SegmentedBar data={data.map((v, i) => ({ label: `c${i}`, value: v }))} title="Edge" />
));
