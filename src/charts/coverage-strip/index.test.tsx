import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { CoverageStrip, coverageSummary } from "./index.js";
import { coverageGeometry } from "./geometry.js";
import { makePercentFormatter } from "../../core/format.js";
import { EN_COVERAGE } from "../../core/strings-coverage.js";
import { expectNoA11yViolations } from "../../test/a11y.js";
import { seriesEdgeSuite } from "../../test/edge-cases.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);

describe("<CoverageStrip>", () => {
  it("summary states coverage + longest gap — the docs' real string", () => {
    const data = [1, 1, null, 1, null, null, 1];
    const { container } = draw(<CoverageStrip data={data} expected={8} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "4 of 8 slots measured (50%); longest gap 2 slots.",
    );
  });

  // 23/40 = 0.575 is a true decimal half. `Intl` (decimal) rounds it up to "58%";
  // `round2` (binary `Math.round` on 57.4999…) collapses it to 0.57 first, so
  // feeding Intl the pre-rounded field yielded "57%" — disagreeing by 1 with
  // the `23 of 40` it sits beside, and with `icon-array`/`progress`, which feed
  // Intl the raw fraction. All three inputs are within COVERAGE_MAX_SLOTS = 120.
  it.each([
    [23, 40],
    [46, 80],
    [69, 120],
  ])("summary rounds %i/%i (57.5%%) up to 58%% — Intl on raw, not round2", (measured, expected) => {
    const data = Array.from({ length: expected }, (_, i) => (i < measured ? 1 : null));
    const { container } = draw(<CoverageStrip data={data} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      `${measured} of ${expected} slots measured (58%); longest gap ${expected - measured} slots.`,
    );
  });

  it("coverageSummary feeds Intl the raw ratio (shared with client.tsx)", () => {
    // client.tsx shares this function, so pinning it covers the interactive
    // path without a browser: 23/40 → "58%" (was "57%" pre-fix).
    const geo = coverageGeometry({
      width: 80,
      height: 10,
      shape: "square",
      data: Array.from({ length: 40 }, (_, i) => (i < 23 ? 1 : null)),
    });
    const pctFmt = makePercentFormatter("en");
    expect(coverageSummary(geo, pctFmt, EN_COVERAGE)).toBe(
      "23 of 40 slots measured (58%); longest gap 17 slots.",
    );
  });

  it("measured cells are filled, gaps are hollow — 0 ≠ null", () => {
    const { container } = draw(<CoverageStrip data={[0, null, 5]} />);
    const rects = [...container.querySelectorAll("rect")];
    expect(rects.length).toBe(3);
    // the measured zero is a solid accent cell; the gap is a faint track slot.
    // both colors come from ink-role rules (styles.css) — no inline fill now.
    expect(rects[0]!.getAttribute("data-mc-ink")).toBe("cell");
    expect(rects[1]!.getAttribute("data-mc-ink")).toBe("gap");
    expect(rects[1]!.getAttribute("fill")).toBe(null);
  });

  it("label='percent' states coverage in a right gutter (wider viewBox)", () => {
    const plain = draw(<CoverageStrip data={[1, null, 1, 1]} />).container;
    const labeled = draw(<CoverageStrip data={[1, null, 1, 1]} label="percent" />).container;
    const wPlain = plain.querySelector("svg")!.getAttribute("viewBox")!.split(" ")[2];
    const wLabeled = labeled.querySelector("svg")!.getAttribute("viewBox")!.split(" ")[2];
    expect(Number(wLabeled)).toBeGreaterThan(Number(wPlain));
    expect(labeled.querySelector("text")!.textContent).toBe("75%");
  });

  it("label='percent' rounds 57.5% up to 58% in the gutter (raw ratio to Intl)", () => {
    const data = Array.from({ length: 40 }, (_, i) => (i < 23 ? 1 : null));
    const { container } = draw(<CoverageStrip data={data} label="percent" />);
    expect(container.querySelector("text")!.textContent).toBe("58%");
  });

  it("1 node per cell (node budget)", () => {
    const { container } = draw(<CoverageStrip data={[1, 2, 3, null, 5]} />);
    expect(container.querySelectorAll("svg *").length).toBe(5);
  });

  it("a hostile `expected` never blanks the strip or the count", () => {
    const data = [1, 1, null, 1, null, null, 1];
    for (const bad of [Number.NaN, Number.POSITIVE_INFINITY]) {
      const { container } = draw(<CoverageStrip data={data} expected={bad} />);
      expect(container.querySelectorAll("rect").length).toBe(7);
      expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
        "4 of 7 slots measured (57%); longest gap 2 slots.",
      );
    }
  });

  it("a hostile `steps` never reaches the intensity ramp", () => {
    for (const bad of [Number.NaN, Number.POSITIVE_INFINITY]) {
      const { container } = draw(
        <CoverageStrip data={[0, null, 100]} mode="intensity" steps={bad} domain={[0, 100]} />,
      );
      const ops = [...container.querySelectorAll('rect[data-mc-ink="cell"]')].map((r) =>
        r.getAttribute("fill-opacity"),
      );
      // the geometry falls back to 5 steps, so the paint must too
      expect(ops).toEqual(["0.25", "1"]);
    }
  });

  it("is axe-clean", async () => {
    const { container } = draw(<CoverageStrip data={[1, null, 3]} title="Sensor uptime" />);
    await expectNoA11yViolations(container);
  });
});

seriesEdgeSuite("CoverageStrip", (data) => <CoverageStrip data={data} title="Edge" />);

describe("<CoverageStrip> degrades at small sizes", () => {
  const DATA = [1, null, 3];
  // The percent rides the strip's midline; below one em of box height its
  // em-box crosses the viewBox edge, so it drops rather than spilling.
  it("keeps the percent while the box holds one em (height 7, font 7)", () => {
    const { container } = draw(
      <CoverageStrip data={DATA} expected={8} label="percent" width={80} height={7} />,
    );
    expect(container.querySelector("text")!.textContent).toBe("25%");
  });

  it("drops the percent below one em — cells stay, gutter goes", () => {
    const { container } = draw(
      <CoverageStrip data={DATA} expected={8} label="percent" width={80} height={6} />,
    );
    expect(container.querySelector("text")).toBeNull();
    // the mark still reads: measured cells AND the shape-carried gaps
    expect(container.querySelector('rect[data-mc-ink="cell"]')).not.toBeNull();
    expect(container.querySelector('rect[data-mc-ink="gap"]')).not.toBeNull();
    // the gutter leaves with the label — the viewBox is the plain box again
    expect(container.querySelector("svg")!.getAttribute("viewBox")).toBe("0 0 80 6");
  });

  it("the cells do not move when the percent drops (no reflow)", () => {
    const cellX = (h: number) =>
      [
        ...draw(
          <CoverageStrip data={DATA} expected={8} label="percent" width={80} height={h} />,
        ).container.querySelectorAll("rect"),
      ].map((r) => r.getAttribute("x"));
    expect(cellX(7)).toEqual(cellX(6));
  });
});
