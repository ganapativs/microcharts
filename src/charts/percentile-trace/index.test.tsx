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

  it("showBands={false} hides the population fields", () => {
    const { container } = draw(<PercentileTrace data={SAMPLE} showBands={false} />);
    expect(container.querySelector("rect")).toBeNull();
  });

  // The valence rides an ink ROLE, never an inline fill: `.mc-root` sets
  // forced-color-adjust: none, so an inline token would paint its own hue in
  // High Contrast Mode instead of taking the CanvasText/GrayText mapping.
  it("endpoint dot carries valence: rising is positive, falling is negative", () => {
    const up = draw(<PercentileTrace data={SAMPLE} />).container.querySelector("circle")!;
    const down = draw(<PercentileTrace data={[80, 60, 40, 20]} />).container.querySelector(
      "circle",
    )!;
    expect(up.getAttribute("data-mc-ink")).toBe("positive");
    expect(down.getAttribute("data-mc-ink")).toBe("negative");
    expect(up.getAttribute("style")).toBeNull();
  });

  it("positive='down' flips the valence — a fall is good", () => {
    const dot = draw(
      <PercentileTrace data={[80, 60, 40, 20]} positive="down" />,
    ).container.querySelector("circle")!;
    expect(dot.getAttribute("data-mc-ink")).toBe("positive");
  });

  it("a flat trace has no valence: accent ink, and `color` overrides it there", () => {
    const flat = draw(<PercentileTrace data={[50, 50, 50]} />).container.querySelector("circle")!;
    expect(flat.getAttribute("data-mc-ink")).toBe("accent");
    const tinted = draw(
      <PercentileTrace data={[50, 50, 50]} color="#123456" />,
    ).container.querySelector("circle")!;
    expect(tinted.getAttribute("style")).toContain("rgb(18, 52, 86)");
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

// Hostile CONFIG: the box is a host input too (a CSS var read back, a collapsed
// flex measurement). `Chart` clamps only the FRAME, so a raw prop reaching
// geometry emitted NaN coords — or x=-42 — inside a perfectly valid viewBox,
// and `.mc-root` is overflow: visible, so that spills into the page.
describe("PercentileTrace hostile box", () => {
  const NUMERIC = /^(?:d|x|y|cx|cy|width|height|font-size)$/;

  const attrValues = (container: HTMLElement): string[] =>
    [...container.querySelectorAll("svg *")].flatMap((el) =>
      [...el.attributes].filter((a) => NUMERIC.test(a.name)).map((a) => a.value),
    );

  for (const side of ["width", "height"] as const) {
    for (const bad of [Number.NaN, Number.POSITIVE_INFINITY, 0, -40]) {
      it(`${side}={${bad}} falls back to the documented box`, () => {
        const { container } = draw(<PercentileTrace data={SAMPLE} {...{ [side]: bad }} />);
        const svg = container.querySelector("svg")!;
        // 80 wide + the 28-unit gutter the "p81" readout reserves, 20 tall
        expect(svg.getAttribute("viewBox")).toBe("0 0 108 20");
        for (const v of attrValues(container)) expect(v).not.toMatch(/NaN|Infinity/);
        // the label size + the inline seat are derived from the same box
        expect(svg.getAttribute("style")).not.toMatch(/NaN|Infinity/);
      });
    }
  }

  it("a box narrower than twice the pad keeps every coord inside the viewBox", () => {
    const { container } = draw(<PercentileTrace data={SAMPLE} width={3} height={2} />);
    const svg = container.querySelector("svg")!;
    const [, , vw, vh] = svg.getAttribute("viewBox")!.split(" ").map(Number);
    const coords = [...svg.querySelectorAll("path")].flatMap((p) =>
      [...p.getAttribute("d")!.matchAll(/(-?\d+(?:\.\d+)?)\s(-?\d+(?:\.\d+)?)/g)].map(
        (m) => [Number(m[1]), Number(m[2])] as const,
      ),
    );
    expect(coords.length).toBeGreaterThan(0);
    for (const [x, y] of coords) {
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThanOrEqual(vw!);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThanOrEqual(vh!);
    }
  });
});

// Degradation contract (tests/craft/floor.mjs): a label the box can no longer
// seat is DROPPED — never painted outside the viewBox, never stacked on a
// neighbour — the reserved gutter goes with it, and the mark still renders.
describe("PercentileTrace degradation", () => {
  it("the percentile readout drops under a 7-unit box, the trace still draws", () => {
    const big = draw(<PercentileTrace data={SAMPLE} width={240} height={32} />).container;
    expect(big.querySelector("text")).not.toBeNull();

    const small = draw(<PercentileTrace data={SAMPLE} width={48} height={6} />).container;
    expect(small.querySelector("text")).toBeNull();
    expect(small.querySelectorAll("path").length).toBeGreaterThan(0);
  });
});
