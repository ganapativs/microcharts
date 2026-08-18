import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { TreeRings, treeRingsSummary } from "./index.js";
import { expectNoA11yViolations } from "../../test/a11y.js";
import { mappedEdgeSuite } from "../../test/edge-cases.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);
const YEARS = [8, 12, 10, 18, 22, 15, 20, 14];

describe("<TreeRings>", () => {
  it("summary names the latest and biggest period", () => {
    const { container } = draw(<TreeRings data={YEARS} unit="years" periodWord="year" />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "8 years; latest 14, biggest 22 in year 5.",
    );
  });

  it("renders one boundary ring per period + the centre dot, merged into one path", () => {
    const { container } = draw(<TreeRings data={YEARS} />);
    // 7 non-highlighted boundaries merge into one muted path (SSR hot path)...
    const rings = container.querySelector('path[data-mc-ink="muted"]')!;
    expect((rings.getAttribute("d")!.match(/M/g) ?? []).length).toBe(7);
    // ...leaving 2 circles: the highlighted (last) ring + the centre dot.
    expect(container.querySelectorAll("circle").length).toBe(2);
  });

  it("highlight='last' emphasizes the outermost ring (weight, not color-alone)", () => {
    const { container } = draw(<TreeRings data={YEARS} />);
    // Weight comes from the width ramp rather than an inline multiplier, so the
    // emphasis is `anchor` (3/2 of the token) against the muted rings.
    const accent = [...container.querySelectorAll("circle")].find(
      (c) => c.getAttribute("data-mc-w") === "anchor",
    );
    expect(accent).toBeTruthy();
  });

  it("rings='fill' merges each opacity parity into one evenodd path", () => {
    const { container } = draw(<TreeRings data={YEARS} rings="fill" />);
    const paths = [...container.querySelectorAll("path")];
    // two muted parities + the highlighted ring — not one node per period
    expect(paths.length).toBe(3);
    // 4 even rings + 3 odd (the 8th is the highlight), 2 circles per annulus
    expect((paths[0]!.getAttribute("d")!.match(/M/g) ?? []).length).toBe(8);
    expect((paths[1]!.getAttribute("d")!.match(/M/g) ?? []).length).toBe(6);
    for (const p of paths) expect(p.getAttribute("fill-rule")).toBe("evenodd");
  });

  it("rings='fill' takes its neutral from the ink role, not an inline hex", () => {
    // `.mc-root` sets forced-color-adjust: none, so an inline fill survives
    // verbatim into High Contrast Mode; the alternating opacity stays inline
    // because it is what separates neighbouring rings.
    const { container } = draw(<TreeRings data={YEARS} rings="fill" />);
    const muted = [...container.querySelectorAll('path[data-mc-ink="fill"]')];
    expect(muted.length).toBe(2);
    for (const p of muted) expect(p.getAttribute("style")).not.toMatch(/fill:/);
    expect(muted.map((p) => p.getAttribute("style"))).toEqual([
      "fill-opacity: 0.22;",
      "fill-opacity: 0.4;",
    ]);
  });

  it("the boundary rings carry a width role, so --mc-density reaches them", () => {
    const { container } = draw(<TreeRings data={YEARS} />);
    expect(container.querySelector('path[data-mc-ink="muted"]')!.getAttribute("data-mc-w")).toBe(
      "support",
    );
  });

  it("label='last' prints the latest value", () => {
    const { container } = draw(<TreeRings data={YEARS} label="last" />);
    expect(container.querySelector("text")!.textContent).toBe("14");
  });

  it("summary={false} hides it from assistive tech", () => {
    const { container } = draw(<TreeRings data={YEARS} summary={false} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBeNull();
  });

  it("is axe-clean", async () => {
    const { container } = draw(<TreeRings data={YEARS} title="Account age" />);
    await expectNoA11yViolations(container);
  });

  describe("degenerate periods", () => {
    it("a gap period is not 'latest' — the last MEASURED period is", () => {
      expect(treeRingsSummary([8, 12, null] as unknown as number[])).toBe(
        "3 periods; latest 12, biggest 12 in period 2.",
      );
    });

    it("no measured period reads as no data, never as NaN", () => {
      expect(treeRingsSummary([null, null] as unknown as number[])).toBe("No data.");
      expect(treeRingsSummary([Number.NaN, Number.POSITIVE_INFINITY])).toBe("No data.");
    });

    it("all-null still draws the centre dot — empty is visible, not blank", () => {
      const { container } = draw(<TreeRings data={[null, null] as unknown as number[]} />);
      expect(container.querySelectorAll("circle").length).toBeGreaterThan(0);
    });
  });

  // A host computes these; `Number("")` is NaN and a lifetime total can arrive
  // as Infinity. Each one used to render a normal-looking chart whose painted
  // scale disagreed with the scale its accessible name announced.
  describe("hostile config props", () => {
    const attrs = (container: HTMLElement) =>
      [...container.querySelectorAll("*")].flatMap((el) => [...el.attributes].map((a) => a.value));

    it("a non-finite size keeps the disc on the default 24-unit box", () => {
      for (const bad of [Number.NaN, Number.POSITIVE_INFINITY, 0, -20]) {
        const { container } = draw(<TreeRings data={YEARS} size={bad} />);
        const svg = container.querySelector("svg")!;
        expect(svg.getAttribute("viewBox")).toBe("0 0 24 24");
        expect(attrs(container).filter((v) => /NaN|Infinity/.test(v))).toEqual([]);
      }
    });

    it("a non-finite fontSize keeps the label gutter inside the viewBox", () => {
      // NaN reached the gutter arithmetic, so Chart clamped the viewBox to one
      // unit wide while the disc still painted out to `size`.
      const { container } = draw(<TreeRings data={YEARS} label="last" fontSize={Number.NaN} />);
      const svg = container.querySelector("svg")!;
      expect(svg.getAttribute("viewBox")).toBe("0 0 43 24");
      expect(svg.getAttribute("style")).toContain("--mc-label-px: 11px");
      expect(container.querySelector("text")!.getAttribute("font-size")).toBe("11");
    });

    it("an infinite total paints the same disc as no total at all", () => {
      const inf = draw(<TreeRings data={YEARS} total={Number.POSITIVE_INFINITY} />);
      const none = draw(<TreeRings data={YEARS} />);
      const d = (c: HTMLElement) => c.querySelector('path[data-mc-ink="muted"]')?.getAttribute("d");
      expect(d(inf.container)).toBe(d(none.container));
      expect(d(inf.container)).toBeTruthy();
    });

    it("a size too small for rings still paints the centre dot inside the box", () => {
      const { container } = draw(<TreeRings data={YEARS} size={3} />);
      const dot = container.querySelector('circle[data-mc-ink="point"]')!;
      const [cx, r] = [+dot.getAttribute("cx")!, +dot.getAttribute("r")!];
      expect(r).toBeGreaterThan(0);
      expect(cx - r).toBeGreaterThanOrEqual(0);
      expect(cx + r).toBeLessThanOrEqual(3);
    });
  });
});

// `data` is typed `number[]`, but the geometry has always treated a gap as
// no-growth, so the runtime owes the full matrix the same floor as a sparkline.
mappedEdgeSuite(
  "TreeRings",
  (v) => v as number,
  (data) => <TreeRings data={data} label="last" title="Growth" unit="years" periodWord="year" />,
);
