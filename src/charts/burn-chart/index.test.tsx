import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { BurnChart } from "./index.js";
import { expectNoA11yViolations } from "../../test/a11y.js";
import { expectHostsAnnotations } from "../../test/annotation-host.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);
const PLAN = [40, 36, 32, 28, 24, 20, 16, 12, 8, 4, 0];
const ACTUAL = [40, 38, 36, 34, 32, 30];

describe("<BurnChart>", () => {
  // With no plan there is no deadline to be late against. The geometry stood a
  // synthetic one on today to keep the projection drawable, and the gutter
  // painted that as "+7 d" in negative ink beside a summary that says no plan
  // is recorded.
  it("paints no schedule verdict when no plan is recorded", () => {
    const { container } = draw(
      <BurnChart data={{ plan: [], actual: [40, 35, 31, 27, 24, 21] }} label="gap" />,
    );
    const svg = container.querySelector("svg")!;
    expect(svg.getAttribute("aria-label")).toBe("6 days in: 21 points remain.");
    expect(svg.querySelector("text")).toBeNull();
  });

  it("summary states progress vs plan and the projected landing — the real string", () => {
    const { container } = draw(<BurnChart data={{ plan: PLAN, actual: ACTUAL }} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "6 of 11 days in: 30 points remain vs 20 planned — projected to finish 10 days late.",
    );
  });

  it("flatlined burn → 'not finishing at the current pace'", () => {
    const { container } = draw(
      <BurnChart data={{ plan: PLAN, actual: [40, 38, 37, 36, 36, 36] }} />,
    );
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toContain(
      "not finishing at the current pace",
    );
  });

  it("plan (dashed) + actual + projection + today tick", () => {
    const { container } = draw(<BurnChart data={{ plan: PLAN, actual: ACTUAL }} />);
    const plan = container.querySelector('path[data-mc-ink="muted"]')!;
    expect(plan.getAttribute("stroke-dasharray")).toBe("2.5 2.5");
    expect(container.querySelector('path[data-mc-ink="data"]')).not.toBeNull(); // actual
    expect(container.querySelectorAll("path").length).toBe(3); // plan, projection, actual
    expect(container.querySelectorAll("line").length).toBe(1); // today tick
  });

  it("projection={false} drops the projection and the gap label", () => {
    const { container } = draw(
      <BurnChart data={{ plan: PLAN, actual: ACTUAL }} projection={false} />,
    );
    expect(container.querySelectorAll("path").length).toBe(2); // plan + actual only
    expect(container.querySelector("text")).toBeNull();
  });

  it("label='gap' states the signed schedule delta; 'none' shows no text", () => {
    const labeled = draw(<BurnChart data={{ plan: PLAN, actual: ACTUAL }} />).container;
    const none = draw(<BurnChart data={{ plan: PLAN, actual: ACTUAL }} label="none" />).container;
    expect(labeled.querySelector("text")!.textContent).toBe("+10 d");
    expect(none.querySelector("text")).toBeNull();
  });

  it("counts the plotted days, not the raw arrays", () => {
    // actual [40, NaN, 36, 34] draws three points; the summary used to open
    // "4 of 11 days in" over a line that stops at day 2.
    const { container } = draw(<BurnChart data={{ plan: PLAN, actual: [40, NaN, 36, 34] }} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toContain(
      "3 of 11 days in: 34 points remain",
    );
  });

  it("nothing plotted in `actual` → no measured remainder is claimed, no today dot", () => {
    // A plan with no recorded burn used to announce "0 points remain" and paint
    // an accent dot on the zero floor — "finished" — for work never recorded.
    for (const actual of [[], [NaN, NaN]]) {
      const { container } = draw(<BurnChart data={{ plan: PLAN, actual }} />);
      expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe("No data.");
      expect(container.querySelector("circle")).toBeNull();
      expect(container.querySelector('path[data-mc-ink="muted"]')).not.toBeNull(); // plan still draws
    }
  });

  it("the gap numeral carries a valence ink ROLE, never an inline fill", () => {
    // `.mc-root` sets forced-color-adjust: none, so an inline var(--mc-negative)
    // survived verbatim into High Contrast Mode and no consumer rule could
    // reach it. The role paints the same token and earns the mapping.
    const late = draw(<BurnChart data={{ plan: PLAN, actual: ACTUAL }} />).container;
    const early = draw(
      <BurnChart data={{ plan: PLAN, actual: [40, 34, 28, 22, 16, 10] }} />,
    ).container;
    expect(late.querySelector("text")!.getAttribute("data-mc-ink")).toBe("negative");
    expect(early.querySelector("text")!.getAttribute("data-mc-ink")).toBe("positive");
    for (const c of [late, early])
      expect(c.querySelector("text")!.getAttribute("style")).toBeNull();
  });

  it("an astral unit noun keeps a whole code point in the gap label", () => {
    // charAt(0) emitted a lone surrogate — half a character in the gutter.
    const { container } = draw(<BurnChart data={{ plan: PLAN, actual: ACTUAL }} unit="🗓day" />);
    expect(container.querySelector("text")!.textContent).toBe("+10 🗓");
  });

  it("is axe-clean", async () => {
    const { container } = draw(
      <BurnChart data={{ plan: PLAN, actual: ACTUAL }} title="Sprint 12" />,
    );
    await expectNoA11yViolations(container);
  });

  it("empty data → renders the empty frame, no crash", () => {
    const { container } = draw(<BurnChart data={{ plan: [], actual: [] }} title="Empty" />);
    expect(container.querySelector("svg")).not.toBeNull();
  });

  it("hosts annotations (marks drawn + clamped in frame)", () => {
    expectHostsAnnotations(
      (children) => (
        <BurnChart
          data={{ plan: PLAN, actual: ACTUAL }}
          label="none"
          width={90}
          height={28}
          summary={false}
        >
          {children}
        </BurnChart>
      ),
      90,
      28,
    );
  });
});

// Degradation contract (tests/craft/floor.mjs): a label the box can no longer
// seat is DROPPED — never painted outside the viewBox, never stacked on a
// neighbour — the reserved gutter goes with it, and the mark still renders.
describe("BurnChart degradation", () => {
  it("the gap readout drops under a 7-unit box, plan + actual still draw", () => {
    const big = draw(
      <BurnChart data={{ plan: PLAN, actual: ACTUAL }} width={240} height={32} />,
    ).container;
    expect(big.querySelector("text")).not.toBeNull();

    const small = draw(
      <BurnChart data={{ plan: PLAN, actual: ACTUAL }} width={48} height={6} />,
    ).container;
    expect(small.querySelector("text")).toBeNull();
    expect(small.querySelectorAll("path").length).toBeGreaterThan(0);
  });
});
