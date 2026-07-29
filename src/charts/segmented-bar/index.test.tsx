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

  it("the painted percent is the announced percent", () => {
    // The labels used to be derived from the geometry's 2-dp-rounded shares
    // while the summary read the raw values: this composition painted "55%"
    // over a segment the accessible name called 54%.
    const { container } = draw(
      <SegmentedBar
        data={[
          { label: "a", value: 626 },
          { label: "b", value: 341 },
          { label: "c", value: 189 },
        ]}
        width={300}
        height={20}
      />,
    );
    const painted = [...container.querySelectorAll("text")].map((t) => t.textContent);
    expect(painted).toEqual(["54%", "30%", "16%"]);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe("a 54%, b 30%, c 16%.");
  });

  it("a non-finite width/height never reaches a coordinate or the seat", () => {
    // `Chart` clamps the frame; the marks used to be laid out against the raw
    // prop and emitted width="NaN" rects (and --mc-seat: NaN) inside it.
    for (const [w, h] of [
      [NaN, 10],
      [60, NaN],
      [0, 10],
      [60, Infinity],
    ] as const) {
      const { container } = draw(<SegmentedBar data={MIX} width={w} height={h} />);
      const svg = container.querySelector("svg")!;
      expect(svg.getAttribute("viewBox")).toBe("0 0 60 10");
      for (const el of container.querySelectorAll("*"))
        for (const a of el.attributes) expect(a.value).not.toMatch(/NaN|Infinity/);
      expect(svg.getAttribute("style")).not.toMatch(/NaN|Infinity/);
    }
  });

  it("a hostile maxSegments falls back rather than dissolving the composition", () => {
    // `Number("")` → NaN rolled every category into one "Other" bar, and 0
    // sliced from the end and returned MORE segments than the caller asked for.
    const nan = draw(<SegmentedBar data={MIX} maxSegments={NaN} />).container;
    expect(nan.querySelectorAll("rect").length).toBe(5);
    expect(nan.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "Chrome 62%, Safari 24%, Firefox 9%, Edge 3%, Other 2%.",
    );
    const zero = draw(<SegmentedBar data={MIX} maxSegments={0} />).container;
    expect(zero.querySelectorAll("rect").length).toBe(1);
    expect(zero.querySelector("svg")!.getAttribute("aria-label")).toBe("Other 100%.");
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
