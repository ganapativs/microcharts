import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { NetFlow } from "./index.js";
import type { NetFlowPeriod } from "./geometry.js";
import { expectNoA11yViolations } from "../../test/a11y.js";
import { seriesEdgeSuite } from "../../test/edge-cases.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);
const inAreaRole = (c: Element) => c.querySelectorAll("path")[0]!.getAttribute("data-mc-ink");
const SAMPLE: NetFlowPeriod[] = [
  { in: 4, out: 3 },
  { in: 5, out: 4 },
  { in: 6, out: 4 },
  { in: 5, out: 6 },
  { in: 7, out: 5 },
];

describe("<NetFlow>", () => {
  it("summary states signed net, gross, and net-positive count — the real string", () => {
    const { container } = draw(<NetFlow data={SAMPLE} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "Net +2 last period; in 7 vs out 5; net positive 4 of 5 periods.",
    );
  });

  it("mirrored in/out areas + net line + zero baseline", () => {
    const { container } = draw(<NetFlow data={SAMPLE} />);
    expect(container.querySelectorAll("path").length).toBe(3); // in area, out area, net line
    expect(container.querySelectorAll("line").length).toBe(1); // zero baseline
    // areas are pos/neg valence ink-roles (direction survives forced-colors)
    expect(container.querySelector('path[data-mc-ink="positive"]')).not.toBeNull();
    expect(container.querySelector('path[data-mc-ink="negative"]')).not.toBeNull();
  });

  it("net={false} drops the line (gross flows only)", () => {
    const { container } = draw(<NetFlow data={SAMPLE} net={false} />);
    // only the two area paths remain
    expect(container.querySelectorAll("path").length).toBe(2);
  });

  it("positive='down' swaps the valence coloring (outflow is the goal)", () => {
    const up = draw(<NetFlow data={SAMPLE} />).container;
    const down = draw(<NetFlow data={SAMPLE} positive="down" />).container;
    // in-area is above the baseline in both; its ink-role flips pos↔neg
    expect(inAreaRole(up)).toBe("positive");
    expect(inAreaRole(down)).toBe("negative");
  });

  it("label='last' states the SIGNED net; 'none' shows no text", () => {
    const labeled = draw(<NetFlow data={SAMPLE} />).container;
    const none = draw(<NetFlow data={SAMPLE} label="none" />).container;
    expect(labeled.querySelector("text")!.textContent).toBe("+2");
    expect(none.querySelector("text")).toBeNull();
  });

  it("mode='bars' renders mirrored columns", () => {
    const { container } = draw(<NetFlow data={SAMPLE} mode="bars" />);
    // 5 in-bars + 5 out-bars (all non-zero here)
    expect(container.querySelectorAll("rect").length).toBe(10);
  });

  it("all-zero flow → baseline only, honest summary", () => {
    const { container } = draw(
      <NetFlow
        data={[
          { in: 0, out: 0 },
          { in: 0, out: 0 },
        ]}
      />,
    );
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "No flow across 2 periods.",
    );
    expect(container.querySelectorAll("path").length).toBe(0);
  });

  // The columns used to be keyed by their x. In a box too narrow to separate
  // the slots every column lands on the SAME x, the keys collide, and React
  // drops the duplicates — nine of ten bars silently vanished.
  it("keeps every column in a box too narrow to separate the slots", () => {
    const { container } = draw(<NetFlow data={SAMPLE} mode="bars" width={2} />);
    expect(container.querySelectorAll("rect").length).toBe(10);
  });

  // Area weight is a presentation ATTRIBUTE, not inline style: styles.css is
  // written at :where() zero specificity so a consumer rule can retune a chart,
  // and inline style is the one declaration that cannot be overridden.
  it("paints area weight as an overridable attribute", () => {
    const { container } = draw(<NetFlow data={SAMPLE} />);
    const area = container.querySelector('path[data-mc-ink="positive"]') as SVGElement;
    expect(area.getAttribute("fill-opacity")).toBe("0.2");
    expect(area.style.fillOpacity).toBe("");
    const text = draw(<NetFlow data={SAMPLE} />).container.querySelector("text") as SVGElement;
    expect(text.style.fontVariantNumeric).toBe(""); // styles.css owns tabular-nums
  });

  // A non-finite box prop is uniquely destructive: `Chart` clamps the viewBox,
  // so a chart that laid out against the raw prop emitted NaN coordinates —
  // or negative ones — inside a perfectly valid frame.
  it.each([
    ["width", { width: Number.NaN }],
    ["height", { height: Number.NaN }],
    ["negative width", { width: -40 }],
    ["zero height", { height: 0 }],
  ])("a hostile %s prop never reaches an attribute", (_name, box) => {
    const { container } = draw(<NetFlow data={SAMPLE} {...box} />);
    const svg = container.querySelector("svg")!;
    const bad = [...svg.outerHTML.matchAll(/="([^"]*)"/g)]
      .map((m) => m[1]!)
      .filter((v) => /NaN|Infinity/.test(v));
    expect(bad).toEqual([]);
    // …and the accessible name still states the real numbers
    expect(svg.getAttribute("aria-label")).toBe(
      "Net +2 last period; in 7 vs out 5; net positive 4 of 5 periods.",
    );
  });

  it("is axe-clean", async () => {
    const { container } = draw(<NetFlow data={SAMPLE} title="Cash flow" />);
    await expectNoA11yViolations(container);
  });
});

seriesEdgeSuite("NetFlow", (data) => (
  <NetFlow data={data.map((v) => ({ in: v as number, out: (v as number) / 2 }))} title="Edge" />
));

// Degradation contract (tests/craft/floor.mjs): a label the box can no longer
// seat is DROPPED — never painted outside the viewBox, never stacked on a
// neighbour — the reserved gutter goes with it, and the mark still renders.
describe("NetFlow degradation", () => {
  it("the net readout drops under a 7-unit box, both flows still draw", () => {
    const big = draw(<NetFlow data={SAMPLE} width={240} height={32} />).container;
    expect(big.querySelector("text")).not.toBeNull();

    const small = draw(<NetFlow data={SAMPLE} width={48} height={6} />).container;
    expect(small.querySelector("text")).toBeNull();
    expect(small.querySelectorAll("path").length).toBeGreaterThan(0);
  });

  // The gutter goes with the label. It is reserved in the viewBox width, so a
  // gutter that outlives its label widens the box the interactive entry maps
  // pointer x over and the crosshair drifts off the cursor.
  it("drops the reserved gutter with the label", () => {
    const small = draw(<NetFlow data={SAMPLE} width={48} height={6} />).container;
    expect(small.querySelector("svg")!.getAttribute("viewBox")).toBe("0 0 48 6");
    const big = draw(<NetFlow data={SAMPLE} width={48} height={32} />).container;
    expect(big.querySelector("svg")!.getAttribute("viewBox")).not.toBe("0 0 48 32");
  });
});
