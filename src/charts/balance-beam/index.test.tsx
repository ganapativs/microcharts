import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { BalanceBeam } from "./index.js";
import { expectNoA11yViolations } from "../../test/a11y.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);
const IN_OUT = [
  { label: "Inflow", value: 620 },
  { label: "outflow", value: 480 },
] as const;

describe("<BalanceBeam>", () => {
  it("summary names both sides and the heavier one", () => {
    const { container } = draw(<BalanceBeam data={IN_OUT} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "Inflow 620 vs outflow 480; Inflow heavier.",
    );
  });

  it("equal weights → balanced", () => {
    const { container } = draw(
      <BalanceBeam
        data={[
          { label: "A", value: 500 },
          { label: "B", value: 500 },
        ]}
      />,
    );
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "A 500 vs B 500; balanced.",
    );
  });

  it("renders fulcrum, beam, and two square weights by default", () => {
    const { container } = draw(<BalanceBeam data={IN_OUT} />);
    expect(container.querySelectorAll("path").length).toBe(1); // fulcrum
    expect(container.querySelectorAll("line").length).toBe(1); // beam
    expect(container.querySelectorAll("rect").length).toBe(2); // weights
  });

  it("shape='round' → circle weights", () => {
    const { container } = draw(<BalanceBeam data={IN_OUT} shape="round" />);
    expect(container.querySelectorAll("circle").length).toBe(2);
    expect(container.querySelectorAll("rect").length).toBe(0);
  });

  it("label='values' prints both numerals", () => {
    const { container } = draw(<BalanceBeam data={IN_OUT} label="values" />);
    const texts = [...container.querySelectorAll("text")].map((t) => t.textContent);
    expect(texts).toEqual(["620", "480"]);
  });

  it("summary={false} hides it from assistive tech", () => {
    const { container } = draw(<BalanceBeam data={IN_OUT} summary={false} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBeNull();
  });

  it("is axe-clean", async () => {
    const { container } = draw(<BalanceBeam data={IN_OUT} title="Cash flow" />);
    await expectNoA11yViolations(container);
  });
});

// `data` is a PAIR of {label,value}, not a Value[], so the shared suite can't
// host it (src/test/edge-cases.ts). This is the same matrix, spelled for a pair:
// same floor — never crash, never leak a non-finite number, keep the name.
describe("<BalanceBeam> edge matrix (pair-shaped; mirrors src/test/edge-cases.ts)", () => {
  type Pair = readonly [{ label: string; value: number }, { label: string; value: number }];
  const p = (a: unknown, b: unknown) =>
    [
      { label: "Inflow", value: a },
      { label: "Outflow", value: b },
    ] as unknown as Pair;

  const CASES: Record<string, Pair> = {
    empty: [] as unknown as Pair,
    "single pan": [{ label: "Inflow", value: 620 }] as unknown as Pair,
    "all equal": p(500, 500),
    "one null": p(620, null),
    "all null": p(null, null),
    "negative only": p(-5, -9),
    "huge magnitudes": p(1e15, 3e15),
    "tiny magnitudes": p(1e-9, 3e-9),
    "NaN and ±Infinity": p(Number.NaN, Number.POSITIVE_INFINITY),
    zeros: p(0, 0),
  };

  for (const [label, data] of Object.entries(CASES)) {
    it(`${label} → renders, no non-finite leak, a11y contract holds`, () => {
      const { container } = draw(<BalanceBeam data={data} label="values" title="Edge" />);
      const svg = container.querySelector("svg")!;
      expect(svg).not.toBeNull();
      for (const el of container.querySelectorAll("*"))
        for (const attr of [
          "d",
          "x",
          "y",
          "x1",
          "x2",
          "y1",
          "y2",
          "cx",
          "cy",
          "r",
          "width",
          "height",
          "viewBox",
          "aria-label",
        ])
          expect(el.getAttribute(attr) ?? "", `<${el.tagName} ${attr}>`).not.toMatch(
            /NaN|Infinity/,
          );
      expect(container.textContent).not.toMatch(/NaN|Infinity|undefined/);
      expect(svg.getAttribute("aria-label")).toBeTruthy();
    });
  }

  it("a missing or null pan is 'No data.', never a comparison against zero", () => {
    for (const data of [CASES.empty!, CASES["single pan"]!, CASES["one null"]!, CASES["all null"]!])
      expect(
        draw(<BalanceBeam data={data} />)
          .container.querySelector("svg")!
          .getAttribute("aria-label"),
      ).toBe("No data.");
  });

  it("empty ≠ zero: the frame stays visible and draws NO weight for a null pan", () => {
    const empty = draw(<BalanceBeam data={CASES["all null"]!} />).container;
    expect(empty.querySelectorAll("path").length).toBe(1); // fulcrum
    expect(empty.querySelectorAll("line").length).toBe(1); // beam, level
    expect(empty.querySelectorAll("rect").length).toBe(0); // no pans weighed
    // …whereas a real zero-vs-zero IS a comparison and still reports it.
    const zeros = draw(<BalanceBeam data={CASES.zeros!} />).container;
    expect(zeros.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "Inflow 0 vs Outflow 0; balanced.",
    );
  });

  it("a null pan leaves the beam level (never tilted as if the side were empty)", () => {
    const beam = draw(<BalanceBeam data={CASES["one null"]!} />).container.querySelector("line")!;
    expect(beam.getAttribute("y1")).toBe(beam.getAttribute("y2"));
  });
});

// Degradation contract (tests/craft/floor.mjs): a label the box can no longer
// seat is DROPPED — never painted outside the viewBox, never stacked on a
// neighbour — the reserved gutter goes with it, and the mark still renders.
describe("BalanceBeam degradation", () => {
  it("both numerals drop rather than colliding, the beam still draws", () => {
    const big = draw(
      <BalanceBeam data={IN_OUT} label="values" width={120} height={44} />,
    ).container;
    expect(big.querySelector("text")).not.toBeNull();

    const small = draw(
      <BalanceBeam data={IN_OUT} label="values" width={24} height={9} />,
    ).container;
    expect(small.querySelector("text")).toBeNull();
    expect(small.querySelector("line")).not.toBeNull();
  });
});
