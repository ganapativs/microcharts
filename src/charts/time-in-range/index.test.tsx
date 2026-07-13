import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { TimeInRange, timeInRangeSummary } from "./index.js";
import { EN_TIME_IN_RANGE } from "../../core/strings-time-in-range.js";
import { expectNoA11yViolations } from "../../test/a11y.js";
import { seriesEdgeSuite } from "../../test/edge-cases.js";
import type { Value } from "../../core/types.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);

describe("<TimeInRange>", () => {
  it("renders one rect per present zone summary + label", () => {
    const { container } = draw(<TimeInRange data={{ below: 9, in: 72, above: 19 }} />);
    expect(container.querySelectorAll("rect").length).toBe(3);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "72% in range, 9% below, 19% above.",
    );
    // default label="in" shows the in-range percent
    expect(container.querySelector("text")!.textContent).toBe("72%");
  });

  it("summary appends severe tiers when present", () => {
    expect(
      timeInRangeSummary(
        { severeBelow: 2, below: 7, in: 72, above: 15, severeAbove: 4 },
        EN_TIME_IN_RANGE,
      ),
    ).toBe("72% in range, 7% below, 15% above, 2% severe low, 4% severe high.");
  });

  it("label='none' draws no text; label='all' labels zones that fit", () => {
    const none = draw(<TimeInRange data={{ below: 9, in: 72, above: 19 }} label="none" />);
    expect(none.container.querySelectorAll("text").length).toBe(0);
    const all = draw(
      <TimeInRange data={{ below: 30, in: 40, above: 30 }} label="all" width={160} height={20} />,
    );
    expect(all.container.querySelectorAll("text").length).toBeGreaterThan(1);
  });

  it("all-zero data → empty strip, summary No data.", () => {
    const { container } = draw(<TimeInRange data={{ below: 0, in: 0, above: 0 }} />);
    expect(container.querySelectorAll("rect").length).toBe(0);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe("No data.");
  });

  it("is axe-clean", async () => {
    const { container } = draw(
      <TimeInRange data={{ below: 9, in: 72, above: 19 }} title="Glucose in range" />,
    );
    await expectNoA11yViolations(container);
  });
});

seriesEdgeSuite("TimeInRange", (data: readonly Value[]) => (
  <TimeInRange
    data={
      {
        severeBelow: data[0] as number,
        below: (data[1] ?? 0) as number,
        in: (data[2] ?? 0) as number,
        above: (data[3] ?? 0) as number,
        severeAbove: data[4] as number,
      } as { below: number; in: number; above: number }
    }
    title="Edge"
  />
));
