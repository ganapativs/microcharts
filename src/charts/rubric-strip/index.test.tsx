import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { RubricStrip, rubricStripSummary } from "./index.js";
import { EN_RUBRIC } from "../../core/strings-rubric.js";
import { makeFormatter } from "../../core/format.js";
import { expectNoA11yViolations } from "../../test/a11y.js";
import { seriesEdgeSuite } from "../../test/edge-cases.js";
import type { Value } from "../../core/types.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);
const fmt = makeFormatter(undefined, undefined);

const RUBRIC = [
  { label: "Correctness", score: 0.92, weight: 3 },
  { label: "Coverage", score: 0.78, weight: 2 },
  { label: "Clarity", score: 0.65, weight: 1 },
  { label: "Style", score: 0.41, weight: 1 },
];

describe("<RubricStrip> (plan/25 §6, plan/17 F13)", () => {
  it("renders a bar per criterion; docs-as-tests summary names extremes", () => {
    const { container } = draw(<RubricStrip data={RUBRIC} width={120} height={32} />);
    // 4 tracks + 4 bars
    expect(container.querySelectorAll("rect").length).toBe(8);
    expect(rubricStripSummary(RUBRIC, EN_RUBRIC, fmt)).toBe(
      "4 criteria; highest Correctness (0.92), lowest Style (0.41).",
    );
  });

  it("target renders a threshold tick across all rows", () => {
    const { container } = draw(<RubricStrip data={RUBRIC} target={0.7} width={120} height={32} />);
    expect(container.querySelector("line[stroke-dasharray]")).not.toBeNull();
  });

  it("labels render the criterion names in the gutter", () => {
    const { container } = draw(<RubricStrip data={RUBRIC} width={120} height={56} />);
    const texts = [...container.querySelectorAll("text")].map((t) => t.textContent);
    expect(texts).toEqual(["Correctness", "Coverage", "Clarity", "Style"]);
  });

  it("is axe-clean", async () => {
    const { container } = draw(
      <RubricStrip data={RUBRIC} title="Model eval" width={120} height={32} />,
    );
    await expectNoA11yViolations(container);
  });
});

seriesEdgeSuite("RubricStrip", (data: readonly Value[]) => (
  <RubricStrip
    data={data.map((v, i) => ({ label: `c${i}`, score: typeof v === "number" ? v : 0, weight: 1 }))}
    title="Edge"
  />
));
