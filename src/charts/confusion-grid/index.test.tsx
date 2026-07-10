import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { ConfusionGrid, confusionSummary } from "./index.js";
import { EN_CONFUSION } from "../../core/strings-confusion.js";
import { expectNoA11yViolations } from "../../test/a11y.js";
import { seriesEdgeSuite } from "../../test/edge-cases.js";
import type { Value } from "../../core/types.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);

const CATDOG = {
  labels: ["cat", "dog"],
  counts: [
    [88, 12],
    [10, 59],
  ],
};

describe("<ConfusionGrid> (plan/25 §21, plan/17 F21)", () => {
  it("renders k² cells; docs-as-tests summary with row-normalized phrasing", () => {
    const { container } = draw(<ConfusionGrid data={CATDOG} />);
    expect(container.querySelectorAll('rect[data-mc-ink="cell"]').length).toBe(4);
    expect(confusionSummary(CATDOG, EN_CONFUSION)).toBe(
      "Accuracy 87%. Most confused: cat predicted as dog (12% of cats).",
    );
  });

  it("accents the diagonal by shape (an inset stroke), not color alone", () => {
    const { container } = draw(<ConfusionGrid data={CATDOG} />);
    const rings = container.querySelectorAll('rect[data-mc-ring="accent"]');
    expect(rings.length).toBe(2); // 2 diagonal cells
    // fill="none" must actually win (no ink-role fill collision) — the ring
    // reads as an inset STROKE, never a solid accent-filled square
    expect(rings[0]!.getAttribute("fill")).toBe("none");
  });

  it("perfect diagonal → No confusion.", () => {
    expect(
      confusionSummary(
        {
          labels: ["a", "b"],
          counts: [
            [50, 0],
            [0, 50],
          ],
        },
        EN_CONFUSION,
      ),
    ).toBe("Accuracy 100%. No confusion.");
  });

  it("an empty class row → hollow cells + summary note", () => {
    const { container } = draw(
      <ConfusionGrid
        data={{
          labels: ["cat", "dog"],
          counts: [
            [40, 10],
            [0, 0],
          ],
        }}
      />,
    );
    expect(container.querySelectorAll('rect[data-mc-ink="unit-off"]').length).toBe(2);
    expect(
      confusionSummary(
        {
          labels: ["cat", "dog"],
          counts: [
            [40, 10],
            [0, 0],
          ],
        },
        EN_CONFUSION,
      ),
    ).toContain("No dog samples.");
  });

  it("accuracy label opt-in renders in the gutter", () => {
    const { container } = draw(<ConfusionGrid data={CATDOG} label="accuracy" />);
    expect([...container.querySelectorAll("text")].some((t) => t.textContent === "87%")).toBe(true);
  });

  it("is axe-clean", async () => {
    const { container } = draw(<ConfusionGrid data={CATDOG} title="Classifier" />);
    await expectNoA11yViolations(container);
  });
});

seriesEdgeSuite("ConfusionGrid", (data: readonly Value[]) => {
  const v = (i: number) => (typeof data[i] === "number" ? (data[i] as number) : 0);
  return (
    <ConfusionGrid
      data={{
        labels: ["a", "b"],
        counts: [
          [v(0), v(1)],
          [v(2), v(3)],
        ],
      }}
      title="Edge"
    />
  );
});
