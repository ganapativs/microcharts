import { describe, it, expect, vi, afterEach } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { MiniBar, type MiniBarDatum } from "./index.js";
import { textGutter } from "../../core/labels.js";
import { expectNoA11yViolations } from "../../test/a11y.js";
import { seriesEdgeSuite } from "../../test/edge-cases.js";
import { expectHostsAnnotations } from "../../test/annotation-host.js";

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

  it("default keeps data order; order='desc' ranks", () => {
    const plain = heights(draw(<MiniBar data={DATA} />).container);
    expect(plain[0]!).toBeGreaterThan(plain[1]!); // East then West — data order
    const sorted = heights(draw(<MiniBar data={DATA} order="desc" />).container);
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

  it("data-mc-origin follows true geometric sign (honest growth edge)", () => {
    const signed: MiniBarDatum[] = [
      { label: "a", value: 5 },
      { label: "b", value: -3 },
    ];
    const vert = [...draw(<MiniBar data={signed} />).container.querySelectorAll("rect")];
    expect(vert[0]!.getAttribute("data-mc-origin")).toBe("bottom"); // above zero
    expect(vert[1]!.getAttribute("data-mc-origin")).toBe("top"); // below zero
    const horiz = [
      ...draw(<MiniBar data={signed} orientation="horizontal" />).container.querySelectorAll(
        "rect",
      ),
    ];
    expect(horiz[0]!.getAttribute("data-mc-origin")).toBe("left");
    expect(horiz[1]!.getAttribute("data-mc-origin")).toBe("right");
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

  // The max readout is the only text this chart paints, and `.mc-root` is
  // `overflow: visible` — a label pushed past an edge lands in the page. Before
  // the reserved band it did exactly that: anchored on the max bar with no
  // horizontal gutter and floored at 0.55 × fontSize instead of the ascent.
  const maxLabel = (c: HTMLElement) => c.querySelector("text");
  const extents = (t: SVGTextElement) => {
    const fs = Number(t.getAttribute("font-size"));
    const x = Number(t.getAttribute("x"));
    const y = Number(t.getAttribute("y"));
    const w = textGutter(t.textContent!.length, fs, 2);
    return { left: x - w / 2, right: x + w / 2, top: y - fs * 0.78, bottom: y + fs * 0.22 };
  };

  const CONTAINMENT: [string, MiniBarDatum[], number, number][] = [
    ["max first, narrow box", DATA, 50, 16],
    ["max last", [...DATA].reverse(), 50, 16],
    ["grouped digits", DATA.map((d) => ({ ...d, value: d.value! * 1000 })), 90, 16],
    ["tall box", DATA, 80, 40],
    ["all negative", DATA.map((d) => ({ ...d, value: -d.value! })), 50, 16],
    ["all zero", DATA.map((d) => ({ ...d, value: 0 })), 50, 16],
  ];

  it.each(CONTAINMENT)("label='max' stays inside the viewBox: %s", (_name, data, width, height) => {
    const { container } = draw(<MiniBar data={data} label="max" width={width} height={height} />);
    const t = maxLabel(container);
    if (!t) return; // dropped out — the other containment answer
    const e = extents(t);
    expect(e.left).toBeGreaterThanOrEqual(-0.01);
    expect(e.right).toBeLessThanOrEqual(width + 0.01);
    expect(e.top).toBeGreaterThanOrEqual(-0.01);
    expect(e.bottom).toBeLessThanOrEqual(height + 0.01);
  });

  const topBarY = (c: HTMLElement) =>
    [...c.querySelectorAll("rect")].reduce(
      (m, r) => Math.min(m, Number(r.getAttribute("y"))),
      Infinity,
    );

  it("label='max' reserves its band before geometry (no bar under the text)", () => {
    const { container } = draw(<MiniBar data={DATA} label="max" />);
    expect(topBarY(container)).toBeGreaterThan(Number(maxLabel(container)!.getAttribute("y")));
    // and the band is given back when the label goes
    expect(topBarY(draw(<MiniBar data={DATA} />).container)).toBeLessThan(topBarY(container));
  });

  it("label='max' drops out when the box can't seat it", () => {
    // too narrow for the digits at this size…
    expect(
      maxLabel(
        draw(<MiniBar data={[{ label: "a", value: 94000000 }]} label="max" width={24} />).container,
      ),
    ).toBeNull();
    // …and too short to give the band up
    expect(maxLabel(draw(<MiniBar data={DATA} label="max" height={10} />).container)).toBeNull();
    // no finite value to report
    expect(
      maxLabel(draw(<MiniBar data={[{ label: "a", value: null }]} label="max" />).container),
    ).toBeNull();
    // horizontal runs value along x — documented as vertical-only
    expect(
      maxLabel(draw(<MiniBar data={DATA} label="max" orientation="horizontal" />).container),
    ).toBeNull();
  });

  it("label='max' paints after every bar (a wide label used to be overdrawn)", () => {
    const { container } = draw(<MiniBar data={DATA} label="max" />);
    const marks = [...container.querySelector("svg")!.children].filter(
      (el) => el.tagName === "rect" || el.tagName === "text",
    );
    expect(marks.at(-1)!.tagName).toBe("text");
  });

  it("is axe-clean", async () => {
    const { container } = draw(<MiniBar data={DATA} title="Regional sales" />);
    await expectNoA11yViolations(container);
  });
});

seriesEdgeSuite("MiniBar", (data) => (
  <MiniBar data={data.map((v, i) => ({ label: `c${i}`, value: v }))} title="Edge" />
));

describe("<MiniBar> annotations", () => {
  it("vertical bars host annotations (marks drawn + clamped in frame)", () => {
    expectHostsAnnotations(
      (children) => (
        <MiniBar data={DATA} width={60} height={24} summary={false}>
          {children}
        </MiniBar>
      ),
      60,
      24,
    );
  });
});
