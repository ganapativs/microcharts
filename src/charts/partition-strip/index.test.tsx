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

  // The strip caps at 24 segments. The summary walked the whole tree, so a
  // bundle breakdown wider than that announced a group count and a "largest"
  // the strip never drew.
  it("describes only the segments the 24-segment cap left painted", () => {
    const wide = Array.from({ length: 30 }, (_, i) => ({
      label: `m${i}`,
      // ascending, so the largest node of all is one the cap drops
      value: i + 1,
    }));
    const { container } = draw(<PartitionStrip data={wide} width={200} height={24} />);
    const painted = [...container.querySelectorAll("rect")];
    expect(painted.length).toBe(24);
    const summary = partitionStripSummary(wide, EN_PARTITION);
    expect(summary).toContain("24 groups");
    expect(summary).toContain("largest m23");
    expect(summary).not.toContain("m29");
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

  // A size read off an unmounted element arrives as NaN. <Chart> clamps the
  // viewBox, so the box stayed clean and the accessible name stayed correct
  // while every mark carried `width="NaN"` and the root carried `--mc-seat: NaN`.
  it.each([
    ["width", { width: NaN }],
    ["width ∞", { width: Infinity }],
    ["width 0", { width: 0 }],
    ["height", { height: NaN }],
    ["height ∞", { height: Infinity }],
    ["height -3", { height: -3 }],
  ])("non-finite %s never reaches an attribute", (_name, size) => {
    const { container } = draw(<PartitionStrip data={TREE} labels title="Hostile" {...size} />);
    const svg = container.querySelector("svg")!;
    for (const el of [svg, ...svg.querySelectorAll("*")]) {
      for (const a of Array.from(el.attributes)) {
        expect(a.value, `${el.tagName}[${a.name}]`).not.toMatch(/NaN|Infinity/);
      }
    }
    expect(svg.getAttribute("style") ?? "").not.toMatch(/NaN|Infinity/);
  });

  // Group names are caller prose, not figures this library formatted: uppercase
  // and wide glyphs paint at up to 0.95 units/char, and a label seated at the
  // digits rate ran 5.3 units past the viewBox in a real browser.
  it("drops a label the segment cannot seat at the prose rate", () => {
    const { container } = draw(
      <PartitionStrip
        data={[
          { label: "WWWW", value: 24 },
          { label: "x", value: 76 },
        ]}
        width={120}
        height={24}
      />,
    );
    const painted = [...container.querySelectorAll("text")].map((t) => t.textContent);
    expect(painted).not.toContain("WWWW");
  });

  it("keeps a label the segment can seat", () => {
    const { container } = draw(<PartitionStrip data={TREE} width={200} height={24} />);
    const painted = [...container.querySelectorAll("text")].map((t) => t.textContent);
    expect(painted).toContain("JS");
  });

  // The knockout label ink is sized for a saturated category fill; on the muted
  // neutral it reads 2.9:1 in dark mode. `data-mc-dim` is the hook that steps it
  // back to ordinary label ink (same attribute TraceFold uses).
  it("marks a muted label dim, and leaves the lineage's labels alone", () => {
    const { container } = draw(
      <PartitionStrip data={TREE} emphasis="JS" width={260} height={24} />,
    );
    const byLabel = new Map(
      [...container.querySelectorAll("text")].map((t) => [t.textContent, t] as const),
    );
    expect(byLabel.get("JS")!.hasAttribute("data-mc-dim")).toBe(false);
    expect(byLabel.get("HTML")!.hasAttribute("data-mc-dim")).toBe(true);
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
