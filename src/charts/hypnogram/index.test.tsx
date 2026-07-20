import { describe, it, expect, vi, afterEach } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { Hypnogram, hypnogramSummary } from "./index.js";
import { EN_HYPNOGRAM } from "../../core/strings-hypnogram.js";
import { expectNoA11yViolations } from "../../test/a11y.js";
import { seriesEdgeSuite } from "../../test/edge-cases.js";
import type { Value } from "../../core/types.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);

const SLEEP = [
  { t: 0, state: "Awake" },
  { t: 10, state: "Light" },
  { t: 30, state: "Deep" },
  { t: 50, state: "Light" },
  { t: 60, state: "REM" },
  { t: 80, state: "Light" },
  { t: 90, state: "Awake" },
];

afterEach(() => vi.restoreAllMocks());

describe("<Hypnogram>", () => {
  it("renders a step path summary", () => {
    const { container } = draw(<Hypnogram data={SLEEP} domain={[0, 110]} />);
    expect(container.querySelector('path[data-mc-ink="data"]')).not.toBeNull();
    expect(hypnogramSummary(SLEEP, ["Awake", "Light", "Deep", "REM"], [0, 110], EN_HYPNOGRAM)).toBe(
      "6 transitions across 4 states; longest run Light.",
    );
  });

  it("single state → flat summary, no transitions", () => {
    expect(hypnogramSummary([{ t: 0, state: "Awake" }], ["Awake"], [0, 10], EN_HYPNOGRAM)).toBe(
      "1 state, no transitions; Awake throughout.",
    );
  });

  it("lanes style renders one rect per run, no step path", () => {
    const { container } = draw(<Hypnogram data={SLEEP} domain={[0, 110]} mode="lanes" />);
    expect(container.querySelectorAll("rect").length).toBe(7);
    expect(container.querySelector('path[data-mc-ink="data"]')).toBeNull();
  });

  it("emphasis accents one state with a second path", () => {
    const { container } = draw(<Hypnogram data={SLEEP} domain={[0, 110]} emphasis="Deep" />);
    expect(container.querySelector('path[stroke="var(--mc-accent)"]')).not.toBeNull();
  });

  it("connectors={false} drops the transition strokes", () => {
    const off = draw(<Hypnogram data={SLEEP} domain={[0, 110]} connectors={false} />);
    const on = draw(<Hypnogram data={SLEEP} domain={[0, 110]} />);
    const offStrokes = off.container.querySelectorAll('path[stroke="var(--mc-neutral)"]').length;
    const onStrokes = on.container.querySelectorAll('path[stroke="var(--mc-neutral)"]').length;
    expect(onStrokes).toBeGreaterThan(offStrokes);
  });

  it("is axe-clean", async () => {
    const { container } = draw(<Hypnogram data={SLEEP} domain={[0, 110]} title="Sleep stages" />);
    await expectNoA11yViolations(container);
  });
});

seriesEdgeSuite("Hypnogram", (data: readonly Value[]) => (
  // edge values go in the numeric `t` field (what geometry consumes); states are
  // stable labels so the leak check tests numbers, not deliberately-named states
  <Hypnogram
    data={data.map((v, i) => ({ t: v as number, state: ["Wake", "Light", "Deep"][i % 3]! }))}
    title="Edge"
  />
));

describe("<Hypnogram> colors", () => {
  it("colors[] overrides lane fills in the lanes mode", () => {
    const { container } = draw(
      <Hypnogram
        data={SLEEP}
        domain={[0, 110]}
        mode="lanes"
        colors={["rgb(1, 2, 3)", "rgb(4, 5, 6)"]}
      />,
    );
    const lanes = [...container.querySelectorAll("rect")].filter((r) =>
      r.getAttribute("data-mc-cat"),
    ) as SVGElement[];
    expect(lanes.length).toBeGreaterThan(0);
    expect(lanes[0]!.style.fill).toBe("rgb(1, 2, 3)");
    expect(lanes[0]!.getAttribute("data-mc-cat")).toBe("1");
  });
});

describe("<Hypnogram> degrades at small sizes", () => {
  const NIGHT = [
    { t: 0, state: "Awake" },
    { t: 8, state: "Light" },
    { t: 22, state: "Deep" },
    { t: 50, state: "REM" },
  ];
  const STATES = ["Awake", "REM", "Light", "Deep"];
  const at = (height: number, width = 300) =>
    draw(<Hypnogram data={NIGHT} states={STATES} domain={[0, 120]} width={width} height={height} />)
      .container;

  // Each state name is centred on its row. Once the row pitch is under one em
  // the names stack ("Awake" on "REM") — the reported tab-header failure — and
  // the top and bottom rows push their em-boxes past the viewBox.
  it("keeps the state names while the row pitch holds one em (height 30 → pitch 7)", () => {
    expect([...at(30).querySelectorAll("text")].map((t) => t.textContent)).toEqual(STATES);
  });

  it("drops the state names below one em — the state trace survives", () => {
    const c = at(29);
    expect(c.querySelectorAll("text").length).toBe(0);
    // the mark still reads: the right-angle run path, non-empty
    const run = c.querySelector('path[data-mc-ink="data"]')!;
    expect(run.getAttribute("d")).not.toBe("");
    // and the runs reclaim the gutter: the first run starts at the box edge
    expect(Number(run.getAttribute("d")!.slice(1).split(" ")[0])).toBeLessThan(5);
  });

  it("names too wide for their share of the width drop instead of clipping", () => {
    const c = draw(
      <Hypnogram
        data={[
          { t: 0, state: "Slow-wave sleep" },
          { t: 8, state: "Rapid eye movement" },
        ]}
        width={120}
        height={40}
        labels
      />,
    ).container;
    expect(c.querySelector("text")).toBeNull();
    expect(c.querySelector("path")).not.toBeNull();
  });
});
