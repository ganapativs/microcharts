import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { HeatCell } from "./index.js";
import { expectNoA11yViolations } from "../../test/a11y.js";
import { valueEdgeSuite } from "../../test/edge-cases.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);

describe("<HeatCell>", () => {
  it("renders one stepped-opacity cell; summary is the docs' real string", () => {
    const { container } = draw(<HeatCell value={42} domain={[0, 100]} />);
    const rect = container.querySelector("rect")!;
    expect(rect.getAttribute("data-mc-ink")).toBe("cell");
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe("42 — level 3 of 5.");
  });

  it("higher value → stronger accent mix (calibrated, discrete)", () => {
    const mix = (v: number) =>
      Number(
        /--mc-cell-mix:\s*(\d+)/.exec(
          draw(<HeatCell value={v} domain={[0, 100]} />)
            .container.querySelector("rect")!
            .getAttribute("style") ?? "",
        )?.[1] ?? 0,
      );
    expect(mix(90)).toBeGreaterThan(mix(50));
    expect(mix(50)).toBeGreaterThan(mix(30));
    // same step → same mix (discrete honesty)
    expect(mix(45)).toBe(mix(50));
  });

  it("the fill stays in the stylesheet — an inline fill would beat the forced-colors mapping", () => {
    const { container } = draw(<HeatCell value={0.8} />);
    const rect = container.querySelector("rect[data-mc-cell-mix]")!;
    expect(rect).not.toBeNull();
    expect(rect.getAttribute("style") ?? "").not.toMatch(/(?:^|;)\s*fill:/);
  });

  it("default domain is [0, 1] — documented lone-cell calibration", () => {
    const { container } = draw(<HeatCell value={0.99} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe("0.99 — level 5 of 5.");
  });

  it("shape variants: square is crisp, round/dot are not (canon)", () => {
    const crisp = draw(<HeatCell value={0.5} shape="square" />).container.querySelector("rect")!;
    const round = draw(<HeatCell value={0.5} shape="round" />).container.querySelector("rect")!;
    const dot = draw(<HeatCell value={0.5} shape="dot" />).container.querySelector("rect")!;
    expect(crisp.getAttribute("shape-rendering")).toBe("crispEdges");
    expect(round.getAttribute("shape-rendering")).toBeNull();
    expect(dot.getAttribute("shape-rendering")).toBeNull();
    expect(Number(dot.getAttribute("x"))).toBeGreaterThan(Number(round.getAttribute("x")));
  });

  it("label='value' renders the number when it fits; drops out when it can't", () => {
    const fits = draw(<HeatCell value={0.4} label="value" format={() => "4"} />).container;
    expect(fits.querySelector("text")!.textContent).toBe("4");
    const overflow = draw(
      <HeatCell value={0.4} label="value" format={() => "4,000,000"} />,
    ).container;
    expect(overflow.querySelector("text")).toBeNull();
  });

  // A host `steps` (`Number(field)`, `bins / groups`) used to reach the name
  // verbatim — "42 — level NaN of NaN." over a cell whose `--mc-cell-mix: NaN`
  // was an invalid declaration, so a real value painted uncalibrated.
  it("a hostile `steps` never reaches the name or the ramp", () => {
    for (const bad of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, 0, -3]) {
      const { container } = draw(<HeatCell value={42} domain={[0, 100]} steps={bad} />);
      const svg = container.querySelector("svg")!;
      expect(svg.getAttribute("aria-label"), `steps=${bad}`).toBe("42 — level 3 of 5.");
      expect(container.querySelector("rect")!.getAttribute("style") ?? "").toContain(
        "--mc-cell-mix: 55",
      );
    }
  });

  it("announces the step scale the cell was binned against", () => {
    // 2.5 bins is not a scale anything can be binned on — it rounds to 3, and
    // the name has to say 3 or it describes a scale that was never painted.
    const { container } = draw(<HeatCell value={42} domain={[0, 100]} steps={2.5} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe("42 — level 2 of 3.");
  });

  it("non-finite → empty track cell + 'No data.'", () => {
    const { container } = draw(<HeatCell value={Number.NaN} />);
    expect(container.querySelector("rect")!.getAttribute("data-mc-ink")).toBe("gap");
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe("No data.");
  });

  it("node budget ≤ 2", () => {
    const { container } = draw(<HeatCell value={0.5} label="value" />);
    expect(container.querySelectorAll("svg *").length).toBeLessThanOrEqual(2);
  });

  it("is axe-clean", async () => {
    const { container } = draw(<HeatCell value={0.7} title="Load" />);
    await expectNoA11yViolations(container);
  });
});

valueEdgeSuite("HeatCell", (value) => <HeatCell value={value} title="Edge" label="value" />);
