import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { PartitionStrip, partitionStripSummary } from "./index.js";
import { EN_PARTITION } from "../../core/strings-partition.js";
import { expectNoA11yViolations } from "../../test/a11y.js";
import { seriesEdgeSuite } from "../../test/edge-cases.js";
import type { Value } from "../../core/types.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);

const TREE = [
  {
    label: "JS",
    children: [
      { label: "react", value: 28 },
      { label: "vue", value: 10 },
      { label: "other", value: 6 },
    ],
  },
  {
    label: "CSS",
    children: [
      { label: "tailwind", value: 18 },
      { label: "custom", value: 12 },
    ],
  },
  { label: "HTML", value: 26 },
];

describe("<PartitionStrip>", () => {
  it("renders parent + child rects summary", () => {
    const { container } = draw(<PartitionStrip data={TREE} width={200} height={24} />);
    // 3 parents + 5 children
    expect(container.querySelectorAll("rect").length).toBe(8);
    expect(partitionStripSummary(TREE, EN_PARTITION)).toBe(
      "3 groups, 5 parts; largest JS → react (28% of the whole).",
    );
  });

  it("single-level data → flat summary", () => {
    expect(
      partitionStripSummary(
        [
          { label: "A", value: 60 },
          { label: "B", value: 40 },
        ],
        EN_PARTITION,
      ),
    ).toBe("2 groups; largest A (60% of the whole).");
  });

  it("emphasis accents one node", () => {
    const { container } = draw(
      <PartitionStrip data={TREE} emphasis="react" width={200} height={24} />,
    );
    expect(container.querySelector('rect[data-mc-ink="accent"]')).not.toBeNull();
  });

  it("is axe-clean", async () => {
    const { container } = draw(
      <PartitionStrip data={TREE} title="Bundle composition" width={200} height={24} />,
    );
    await expectNoA11yViolations(container);
  });
});

seriesEdgeSuite("PartitionStrip", (data: readonly Value[]) => (
  <PartitionStrip
    data={data.map((v, i) => ({ label: `g${i}`, value: typeof v === "number" ? v : 0 }))}
    title="Edge"
  />
));
