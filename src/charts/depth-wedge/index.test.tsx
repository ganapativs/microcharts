import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { DepthWedge, depthWedgeSummary } from "./index.js";
import { depthWedgeGeometry, type Level } from "./geometry.js";
import { EN_DEPTH_WEDGE } from "../../core/strings-depth-wedge.js";
import { makeFormatter } from "../../core/format.js";
import { expectNoA11yViolations } from "../../test/a11y.js";
import { mappedEdgeSuite } from "../../test/edge-cases.js";

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

describe("<DepthWedge>", () => {
  it("renders two wedges summary scoped to the range", () => {
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

  // Degradation contract: see tests/craft/floor.mjs.
  it("short box: the spread readout drops, both wedges still render", () => {
    const book = {
      demand: [
        { level: 99.75, amount: 420 },
        { level: 99.5, amount: 360 },
      ],
      supply: [
        { level: 100.25, amount: 300 },
        { level: 100.75, amount: 160 },
      ],
    };
    const big = draw(<DepthWedge data={book} width={320} height={30} />).container;
    expect(big.querySelector("text")).not.toBeNull();

    // the readout rides a top gutter of ~0.7 em; an 8-unit box has no room
    const small = draw(<DepthWedge data={book} width={80} height={8} />).container;
    expect(small.querySelector("text")).toBeNull();
    expect(small.querySelectorAll("path").length).toBe(2);
    expect(small.querySelector("line")).not.toBeNull(); // mid hairline survives
  });
});

// Both fields of a book row are encoded — `level` is x, `amount` is the
// cumulative y — and each side of the book is scanned separately, so the matrix
// runs once per field per side with the other three finite and realistic.
//
// The previous spelling laundered every gap into `amount: 0` (`typeof v ===
// "number" ? v : 0`), which asserted the opposite of "empty ≠ zero" — a level
// nobody quoted was drawn as a level with no size — and pinned `level` to an
// index so a non-finite price never met the scale at all. Splitting also stops
// the two halves of `clean()`'s `isFinite(level) && isFinite(amount)` from
// masking each other. `label="spread"` (default) is on: the spread readout is
// the numeral-leak surface.
const BIDS: readonly Level[] = [
  { level: 99.5, amount: 300 },
  { level: 99, amount: 180 },
];
const ASKS: readonly Level[] = [
  { level: 100.5, amount: 260 },
  { level: 101, amount: 140 },
];
const depthCase =
  (side: "demand" | "supply") =>
  (rows: readonly Level[]): React.ReactElement => (
    <DepthWedge
      data={side === "demand" ? { demand: rows, supply: ASKS } : { demand: BIDS, supply: rows }}
      title="Edge"
    />
  );
mappedEdgeSuite(
  "DepthWedge (degenerate demand level)",
  (v, i) => ({ level: v as number, amount: 100 + i * 20 }),
  depthCase("demand"),
);
mappedEdgeSuite(
  "DepthWedge (degenerate demand amount)",
  (v, i) => ({ level: 99.5 - i * 0.5, amount: v as number }),
  depthCase("demand"),
);
mappedEdgeSuite(
  "DepthWedge (degenerate supply level)",
  (v, i) => ({ level: v as number, amount: 100 + i * 20 }),
  depthCase("supply"),
);
mappedEdgeSuite(
  "DepthWedge (degenerate supply amount)",
  (v, i) => ({ level: 100.5 + i * 0.5, amount: v as number }),
  depthCase("supply"),
);
