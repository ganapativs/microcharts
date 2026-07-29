import { describe, it, expect, vi, afterEach } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { StackedArea } from "./index.js";
import { expectNoA11yViolations } from "../../test/a11y.js";
import { seriesEdgeSuite } from "../../test/edge-cases.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);

const TRAFFIC = [
  { label: "Mobile", values: [30, 35, 40, 42, 45] },
  { label: "Web", values: [40, 39, 38, 38, 38] },
  { label: "API", values: [15, 16, 17, 17, 17] },
];

afterEach(() => {
  vi.restoreAllMocks();
});

describe("<StackedArea>", () => {
  it("≤ 3 stacked layers summary names the leader", () => {
    const { container } = draw(<StackedArea data={TRAFFIC} />);
    expect(container.querySelectorAll("g").length).toBe(3);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "3 series over 5 points; Mobile leads at 45% share.",
    );
  });

  it("negative values dev-warn (clamped by the kernel)", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    draw(<StackedArea data={[{ values: [5, -3, 4] }]} />);
    expect(warn).toHaveBeenCalled();
  });

  it("> 3 series dev-warns and renders only 3", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { container } = draw(
      <StackedArea data={[...TRAFFIC, { label: "Extra", values: [1, 2, 3] }]} />,
    );
    expect(container.querySelectorAll("g").length).toBe(3);
    expect(warn).toHaveBeenCalled();
  });

  it("mode='ridge' renders opaque fills (same stack, new skin)", () => {
    const { container } = draw(<StackedArea data={TRAFFIC} mode="ridge" />);
    const first = container.querySelector("g path")!;
    expect(first.getAttribute("fill-opacity")).toBe("1");
  });

  it("band opacity is an attribute, so the forced-colors cat ramp can win", () => {
    const { container } = draw(<StackedArea data={TRAFFIC} />);
    const areas = [...container.querySelectorAll("path[data-mc-cat]")];
    expect(areas.map((p) => p.getAttribute("fill-opacity"))).toEqual(["0.8", "0.8", "0.8"]);
    // an inline fill-opacity outranks every stylesheet rule, including the
    // `[data-mc-cat]` lightness ramp High Contrast Mode relies on
    expect(areas.every((p) => !(p as SVGElement).style.fillOpacity)).toBe(true);
  });

  it("label='last' + labelAt paints that column's shares, not only the endpoint", () => {
    const last = draw(
      <StackedArea data={TRAFFIC} label="last" width={200} height={60} />,
    ).container;
    const mid = draw(
      <StackedArea data={TRAFFIC} label="last" labelAt={0} width={200} height={60} />,
    ).container;
    const lastTxt = [...last.querySelectorAll("text")].map((t) => t.textContent);
    const midTxt = [...mid.querySelectorAll("text")].map((t) => t.textContent);
    expect(lastTxt).not.toEqual(midTxt);
    // col 0: 30+40+15=85 → Mobile 35%, Web 47%, API 18%
    expect(midTxt).toContain("35%");
  });

  it("endpoint labels read top-down in stack order, not layer order", () => {
    const { container } = draw(<StackedArea data={TRAFFIC} label="last" width={200} height={60} />);
    // bands top→bottom are API 17%, Web 38%, Mobile 45% (layer 0 is the floor),
    // so the label column has to run 17 → 38 → 45 down the right edge
    const byY = [...container.querySelectorAll("text")]
      .map((t) => ({ y: Number(t.getAttribute("y")), text: t.textContent }))
      .sort((a, b) => a.y - b.y);
    expect(byY.map((t) => t.text)).toEqual(["17%", "38%", "45%"]);
  });

  it("dropped labels hand their gutter back to the plot", () => {
    const box = { width: 30, height: 8 } as const;
    const labelled = draw(<StackedArea data={TRAFFIC} label="last" {...box} />).container;
    const plain = draw(<StackedArea data={TRAFFIC} label="none" {...box} />).container;
    expect(labelled.querySelectorAll("text").length).toBe(0);
    // a reserved-but-unused gutter took 21 of these 30 units
    expect(labelled.querySelector("path")!.getAttribute("d")).toBe(
      plain.querySelector("path")!.getAttribute("d"),
    );
  });

  it("a non-finite or non-positive box never emits NaN or coords outside it", () => {
    for (const box of [
      { width: NaN },
      { height: NaN },
      { width: Infinity },
      { width: 0 },
      { height: -40 },
    ] as const) {
      const { container } = draw(<StackedArea data={TRAFFIC} label="last" {...box} />);
      const html = container.innerHTML;
      expect(html).not.toMatch(/NaN|Infinity/);
      const svg = container.querySelector("svg")!;
      const [, , w, h] = svg.getAttribute("viewBox")!.split(" ").map(Number);
      for (const p of container.querySelectorAll("path")) {
        const nums = [...p.getAttribute("d")!.matchAll(/-?\d+(?:\.\d+)?/g)].map((m) =>
          Number(m[0]),
        );
        for (let i = 0; i < nums.length; i++) {
          expect(nums[i]).toBeGreaterThanOrEqual(0);
          expect(nums[i]).toBeLessThanOrEqual((i % 2 === 0 ? w! : h!) + 0.01);
        }
      }
    }
  });

  it("is axe-clean", async () => {
    const { container } = draw(<StackedArea data={TRAFFIC} title="Traffic mix" />);
    await expectNoA11yViolations(container);
  });
});

seriesEdgeSuite("StackedArea", (data) => (
  <StackedArea data={[{ label: "A", values: data }]} title="Edge" />
));

describe("<StackedArea> colors", () => {
  it("colors[] overrides the series palette, cycling", () => {
    const { container } = draw(
      <StackedArea data={TRAFFIC} colors={["rgb(1, 2, 3)", "rgb(4, 5, 6)"]} />,
    );
    const areas = [...container.querySelectorAll("path")].filter((p) =>
      p.getAttribute("data-mc-cat"),
    ) as SVGElement[];
    expect(areas[0]!.style.fill).toBe("rgb(1, 2, 3)");
    expect(areas[1]!.style.fill).toBe("rgb(4, 5, 6)");
    expect(areas[2]!.style.fill).toBe("rgb(1, 2, 3)");
    expect(areas[0]!.getAttribute("data-mc-cat")).toBe("1");
  });

  it("an empty colors[] is no override, on the band AND its hairline", () => {
    const { container } = draw(<StackedArea data={TRAFFIC} colors={[]} />);
    const area = container.querySelector("path[data-mc-cat]") as SVGElement;
    expect(area.style.fill).toBe("");
    // `colors[0 % 0]` is `colors[NaN]`: the band fell back to the cat role but
    // the hairline, which has no role, lost its stroke entirely
    const hairline = container.querySelector('path[fill="none"]')!;
    expect(hairline.getAttribute("stroke")).toBe("var(--mc-cat-1)");
  });
});
