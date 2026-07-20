import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { PartitionStrip, partitionStripSummary } from "./index.js";
import { EN_PARTITION } from "../../core/strings-partition.js";
import { expectNoA11yViolations } from "../../test/a11y.js";
import { mappedEdgeSuite } from "../../test/edge-cases.js";

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

// `parentValue` reads a node's own `value` OR the sum of its children, so the
// matrix runs once down each branch. The previous spelling laundered every gap
// into `value: 0` and never built a child at all — which both hid the child sum
// and asserted that a part nobody measured occupies zero width. `labels` on:
// the numeral leaks live in the text, not the rects.
mappedEdgeSuite(
  "PartitionStrip (degenerate parent value)",
  (v, i) => ({ label: `g${i}`, value: v as number }),
  (data) => <PartitionStrip data={data} labels title="Edge" />,
);
mappedEdgeSuite(
  "PartitionStrip (degenerate child value)",
  (v, i) => ({ label: `g${i}`, children: [{ label: `c${i}`, value: v as number }] }),
  (data) => <PartitionStrip data={data} labels title="Edge" />,
);

describe("<PartitionStrip> colors", () => {
  it("colors[] overrides group fills, cycling", () => {
    const { container } = draw(
      <PartitionStrip data={TREE} colors={["rgb(1, 2, 3)", "rgb(4, 5, 6)"]} />,
    );
    const cat = [...container.querySelectorAll("rect")].filter((r) =>
      r.getAttribute("data-mc-cat"),
    ) as SVGElement[];
    expect(cat.length).toBeGreaterThan(0);
    expect(cat.every((r) => r.style.fill !== "")).toBe(true);
    expect(cat[0]!.style.fill).toBe("rgb(1, 2, 3)");
  });
});
