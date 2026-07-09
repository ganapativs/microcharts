import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { partitionStripGeometry, parentValue } from "./geometry.js";

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

describe("partitionStripGeometry (plan/25 §13, plan/17 F20)", () => {
  it("parent value = own value or the sum of its children", () => {
    expect(parentValue(TREE[0]!)).toBe(44);
    expect(parentValue(TREE[2]!)).toBe(26);
  });

  it("children tile their parent's x-range exactly (alignment is the channel)", () => {
    const geo = partitionStripGeometry({ data: TREE, width: 120, height: 24, gap: 1 });
    const js = geo.segments.find((s) => s.label === "JS")!;
    const kids = geo.segments.filter((s) => s.parent === "JS");
    for (const c of kids) {
      expect(c.x).toBeGreaterThanOrEqual(js.x - 0.01);
      expect(c.x + c.width).toBeLessThanOrEqual(js.x + js.width + 0.01);
    }
  });

  it("parents on row 0, children on row 1; groups counted", () => {
    const geo = partitionStripGeometry({ data: TREE, width: 120, height: 24, gap: 1 });
    expect(geo.groups).toBe(3);
    expect(geo.segments.filter((s) => s.row === 0).length).toBe(3);
    expect(geo.segments.filter((s) => s.row === 1).length).toBe(5);
  });

  test.prop([
    fc.array(
      fc.record({
        label: fc.string({ minLength: 1, maxLength: 4 }),
        value: fc.double({ min: 1, max: 1000, noNaN: true }),
      }),
      {
        minLength: 1,
        maxLength: 6,
      },
    ),
  ])("segments stay inside the viewBox", (rows) => {
    const geo = partitionStripGeometry({ data: rows, width: 120, height: 24, gap: 1 });
    for (const s of geo.segments) {
      expect(s.x).toBeGreaterThanOrEqual(0);
      expect(s.x + s.width).toBeLessThanOrEqual(120.01);
    }
  });
});
