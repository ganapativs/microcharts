import { describe, it, expect, vi, afterEach } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { MiniBar, type MiniBarDatum } from "./index.js";
import { expectNoA11yViolations } from "../../test/a11y.js";
import { seriesEdgeSuite } from "../../test/edge-cases.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);

const DATA: MiniBarDatum[] = [
  { label: "East", value: 940 },
  { label: "West", value: 410 },
  { label: "South", value: 620 },
  { label: "North", value: 120 },
];

afterEach(() => {
  vi.restoreAllMocks();
});

describe("<MiniBar>", () => {
  it("renders one bar per category; summary is the docs' real string", () => {
    const { container } = draw(<MiniBar data={DATA} />);
    expect(container.querySelectorAll("rect").length).toBe(4);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "4 categories. Highest East 940, lowest North 120.",
    );
  });

  const heights = (c: HTMLElement) =>
    [...c.querySelectorAll("rect")].map((r) => Number(r.getAttribute("height")));

  it("default keeps data order; sort='desc' ranks", () => {
    const plain = heights(draw(<MiniBar data={DATA} />).container);
    expect(plain[0]!).toBeGreaterThan(plain[1]!); // East then West — data order
    const sorted = heights(draw(<MiniBar data={DATA} sort="desc" />).container);
    expect([...sorted].sort((a, b) => b - a)).toEqual(sorted);
  });

  it("highlight by label or index → accent ink", () => {
    const { container } = draw(<MiniBar data={DATA} highlight="South" />);
    const bars = [...container.querySelectorAll("rect")];
    expect((bars[2] as SVGElement).getAttribute("data-mc-ink")).toBe("accent");
  });

  it("null keeps its slot (gap, alignment survives)", () => {
    const withNull: MiniBarDatum[] = [
      { label: "a", value: 5 },
      { label: "b", value: null },
      { label: "c", value: 7 },
    ];
    const { container } = draw(<MiniBar data={withNull} />);
    const bars = [...container.querySelectorAll("rect")];
    expect(bars.length).toBe(2); // null bar omitted
    // slot width preserved: the two bars are NOT adjacent
    const x0 = Number(bars[0]!.getAttribute("x"));
    const x1 = Number(bars[1]!.getAttribute("x"));
    expect(x1 - x0).toBeGreaterThan(50 / 3);
  });

  it("signed data + positive → valence tokens; without positive stays single-ink", () => {
    const signed: MiniBarDatum[] = [
      { label: "a", value: 5 },
      { label: "b", value: -3 },
    ];
    const plain = draw(<MiniBar data={signed} />).container;
    expect(plain.querySelectorAll('[data-mc-ink="bar"]').length).toBe(2);
    const valenced = draw(<MiniBar data={signed} positive="up" />).container;
    expect(valenced.querySelector('[data-mc-ink="positive"]')).not.toBeNull();
    expect(valenced.querySelector('[data-mc-ink="negative"]')).not.toBeNull();
  });

  it("> 8 categories → dev warning (cell chart)", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const many = Array.from({ length: 9 }, (_, i) => ({ label: `c${i}`, value: i }));
    draw(<MiniBar data={many} />);
    expect(warn).toHaveBeenCalledOnce();
  });

  it("single category → still renders + summary states it", () => {
    const { container } = draw(<MiniBar data={[{ label: "Only", value: 4 }]} />);
    expect(container.querySelectorAll("rect").length).toBe(1);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toContain("1 category");
  });

  it("is axe-clean", async () => {
    const { container } = draw(<MiniBar data={DATA} title="Regional sales" />);
    await expectNoA11yViolations(container);
  });
});

seriesEdgeSuite("MiniBar", (data) => (
  <MiniBar data={data.map((v, i) => ({ label: `c${i}`, value: v }))} title="Edge" />
));
