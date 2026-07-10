import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { DepthWedge, depthWedgeSummary } from "./index.js";
import { depthWedgeGeometry } from "./geometry.js";
import { EN_DEPTH_WEDGE } from "../../core/strings-depth-wedge.js";
import { makeFormatter } from "../../core/format.js";
import { expectNoA11yViolations } from "../../test/a11y.js";
import { seriesEdgeSuite } from "../../test/edge-cases.js";
import type { Value } from "../../core/types.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);
const fmt = makeFormatter(undefined, undefined);

const BOOK = {
  demand: [
    { level: 99.9, amount: 500 },
    { level: 99.5, amount: 300 },
    { level: 99, amount: 100 },
  ],
  supply: [
    { level: 100.1, amount: 300 },
    { level: 100.5, amount: 200 },
  ],
};

describe("<DepthWedge> (plan/25 §12, plan/17 F5)", () => {
  it("renders two wedges; docs-as-tests summary scoped to the range", () => {
    const { container } = draw(<DepthWedge data={BOOK} />);
    expect(container.querySelectorAll("path").length).toBe(2);
    const geo = depthWedgeGeometry({
      ...BOOK,
      levels: null,
      normalize: false,
      width: 100,
      height: 24,
    });
    expect(depthWedgeSummary(geo, EN_DEPTH_WEDGE, fmt)).toBe(
      "Demand outweighs supply 1.8× within the shown range; spread 0.2.",
    );
  });

  it("supply-leads inverts the wording", () => {
    const geo = depthWedgeGeometry({
      demand: [{ level: 99, amount: 100 }],
      supply: [{ level: 101, amount: 500 }],
      levels: null,
      normalize: false,
      width: 100,
      height: 24,
    });
    expect(depthWedgeSummary(geo, EN_DEPTH_WEDGE, fmt)).toBe(
      "Supply outweighs demand 5× within the shown range; spread 2.",
    );
  });

  it("renders the spread label", () => {
    const { container } = draw(<DepthWedge data={BOOK} />);
    expect(container.querySelector("text")!.textContent).toBe("0.2");
  });

  it("is axe-clean", async () => {
    const { container } = draw(<DepthWedge data={BOOK} title="Order book" />);
    await expectNoA11yViolations(container);
  });
});

seriesEdgeSuite("DepthWedge", (data: readonly Value[]) => {
  const half = Math.ceil(data.length / 2);
  return (
    <DepthWedge
      data={{
        demand: data
          .slice(0, half)
          .map((v, i) => ({ level: 99 - i, amount: typeof v === "number" ? v : 0 })),
        supply: data
          .slice(half)
          .map((v, i) => ({ level: 101 + i, amount: typeof v === "number" ? v : 0 })),
      }}
      title="Edge"
    />
  );
});
