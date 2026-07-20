import { describe, it, expect, vi, afterEach } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { MicroScatter } from "./index.js";
import { expectNoA11yViolations } from "../../test/a11y.js";
import { mappedEdgeSuite } from "../../test/edge-cases.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);

// strongly-correlated cloud with real scatter (r ≈ 0.9+)
const CLOUD = Array.from({ length: 24 }, (_, i) => ({
  x: i,
  y: i * 3 + ((i * 7) % 5) * 4,
}));

afterEach(() => {
  vi.restoreAllMocks();
});

describe("<MicroScatter>", () => {
  it("dots at 75% opacity; summary states r with the relationship word", () => {
    const { container } = draw(<MicroScatter data={CLOUD} />);
    const dot = container.querySelector("circle")!;
    expect(dot.getAttribute("fill-opacity")).toBe("0.75");
    const label = container.querySelector("svg")!.getAttribute("aria-label")!;
    expect(label).toMatch(/^24 points\. Strong positive relationship \(r 0\.9\d?\)\.$/);
  });

  it("2 points → count only, no relationship claim", () => {
    const { container } = draw(<MicroScatter data={CLOUD.slice(0, 2)} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe("2 points.");
  });

  it("trend renders a muted least-squares line under the dots", () => {
    const { container } = draw(<MicroScatter data={CLOUD} trend />);
    const line = container.querySelector("line")!;
    expect(line.getAttribute("data-mc-ink")).toBe("muted");
    expect(container.querySelector("svg")!.firstElementChild!.tagName).not.toBe("circle");
  });

  it("focal accents one point at full opacity", () => {
    const { container } = draw(<MicroScatter data={CLOUD} focal={3} />);
    const focal = [...container.querySelectorAll("circle")].find(
      (c) => c.getAttribute("fill-opacity") === "1",
    )!;
    expect(focal.getAttribute("data-mc-ink")).toBe("accent");
  });

  it("> 60 points → dev warning (overplot cap)", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    draw(<MicroScatter data={Array.from({ length: 61 }, (_, i) => ({ x: i, y: i }))} />);
    expect(warn).toHaveBeenCalledOnce();
  });

  it("is axe-clean", async () => {
    const { container } = draw(<MicroScatter data={CLOUD} title="Latency vs error rate" />);
    await expectNoA11yViolations(container);
  });
});

// Both coordinates are encoded, so the matrix runs once per coordinate. The
// previous spelling pinned `x: i`, so a point with no x-reading — the case that
// would put cx="NaN" in the markup, and that skews the least-squares fit — never
// met the chart. One suite per coordinate keeps the other finite so each half of
// the finiteness filter is exercised alone rather than short-circuited by its
// neighbour, and every matrix value reaches both fields. `trend` is on: the
// regression line is computed from raw pairs and is the second leak surface.
const scatterCase = (data: readonly { x: number; y: number }[]) => (
  <MicroScatter data={data} title="Edge" trend />
);
mappedEdgeSuite("MicroScatter (degenerate x)", (v, i) => ({ x: v as number, y: i }), scatterCase);
mappedEdgeSuite("MicroScatter (degenerate y)", (v, i) => ({ x: i, y: v as number }), scatterCase);
