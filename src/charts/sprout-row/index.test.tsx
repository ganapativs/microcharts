import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { SproutRow } from "./index.js";
import { expectNoA11yViolations } from "../../test/a11y.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);
const ACCT = [
  { label: "Acme", value: 3 },
  { label: "Beta", value: 2 },
  { label: "Gamma", value: 3 },
  { label: "Delta", value: 1 },
  { label: "Echo", value: 0 },
  { label: "Foxtrot", value: 2 },
] as const;

describe("<SproutRow>", () => {
  // The numeral is pinned to a baseline near the top of the box and the glyph
  // grew the full usable height into the same band, so at stage >= 2 the digit
  // painted across the plant. Geometry now carves a top reserve.
  it("keeps the stage numeral clear of the glyph it names", () => {
    const { container } = draw(
      <SproutRow data={[{ label: "Basil", value: 3 }]} label="value" height={46} />,
    );
    const numeralY = Number(container.querySelector("text")!.getAttribute("y"));
    // Every y the glyph path draws; its smallest is the top of the plant. M/L/Q
    // carry x,y pairs, so the odd positions are the ys — the `a` arcs are anchored
    // by an M that is already counted.
    const d = container.querySelector("path")!.getAttribute("d")!;
    const ys: number[] = [];
    for (const [, , nums] of d.matchAll(/([MLQ])([^A-Za-z]*)/g)) {
      const n = nums!.trim().split(/[ ,]+/).filter(Boolean).map(Number);
      for (let i = 1; i < n.length; i += 2) ys.push(n[i]!);
    }
    expect(Math.min(...ys)).toBeGreaterThan(numeralY);
  });

  it("summary counts blooms and seeds", () => {
    const { container } = draw(<SproutRow data={ACCT} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "6 items; 2 at bloom, 1 at seed.",
    );
  });

  it("renders soil + one glyph per non-null item", () => {
    const { container } = draw(<SproutRow data={ACCT} />);
    expect(container.querySelectorAll("line").length).toBe(1); // soil
    expect(container.querySelectorAll('path[data-mc-ink="point"]').length).toBe(6);
  });

  it("null stage → no glyph (soil tick only)", () => {
    const { container } = draw(
      <SproutRow
        data={[
          { label: "A", value: 2 },
          { label: "B", value: null },
        ]}
      />,
    );
    expect(container.querySelectorAll('path[data-mc-ink="point"]').length).toBe(1);
  });

  it("labels renders category labels; label='value' prints stage numbers", () => {
    const withCats = draw(<SproutRow data={ACCT} labels />).container;
    expect([...withCats.querySelectorAll("text")].map((t) => t.textContent)).toContain("Acme");
    const withVals = draw(<SproutRow data={ACCT} label="value" />).container;
    expect([...withVals.querySelectorAll("text")].map((t) => t.textContent)).toContain("3");
  });

  it("category labels: none dropped, legible, and inside the viewBox", () => {
    const { container } = draw(<SproutRow data={ACCT} labels height={44} />);
    const svg = container.querySelector("svg")!;
    const [, , vbW] = svg.getAttribute("viewBox")!.split(" ").map(Number);
    const cats = [...svg.querySelectorAll('text[data-mc-ink="label"]')];
    // every name is rendered — the row widens to fit, it never drops a label
    expect(cats.map((t) => t.textContent)).toEqual(ACCT.map((d) => d.label));
    for (const t of cats) {
      const x = Number(t.getAttribute("x"));
      const fs = Number(t.getAttribute("font-size"));
      expect(fs).toBeGreaterThanOrEqual(7); // library legibility floor, never shrunk to a caption
      // 0.95 em/char — the PROSE estimate the layout reserves with, not the
      // narrower digits rate (a 0.72 assertion would pass on a spilling row)
      const half = (t.textContent!.length * 0.95 * fs) / 2;
      expect(x - half).toBeGreaterThanOrEqual(0);
      expect(x + half).toBeLessThanOrEqual(vbW!);
    }
    // labels stagger onto two tiers, so same-tier centres (two slots apart) are
    // ≥ the widest label extent → no overlap within a tier
    const xs = cats.map((t) => Number(t.getAttribute("x"))).sort((a, b) => a - b);
    const fs = Number(cats[0]!.getAttribute("font-size"));
    const widest = Math.max(...ACCT.map((d) => d.label.length * 0.95 * fs));
    for (let i = 2; i < xs.length; i++) expect(xs[i]! - xs[i - 2]!).toBeGreaterThanOrEqual(widest);
  });

  it("summary={false} hides it from assistive tech", () => {
    const { container } = draw(<SproutRow data={ACCT} summary={false} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBeNull();
  });

  it("is axe-clean", async () => {
    const { container } = draw(<SproutRow data={ACCT} title="Account health" />);
    await expectNoA11yViolations(container);
  });
});

// Every attribute a bad number can hide in — coordinates, the frame, and the
// inline custom property that carries the label size.
const nonFinite = (html: string): string[] =>
  [...html.matchAll(/(?:d|x|y|x1|x2|y1|y2|width|height|font-size|style|viewBox)="([^"]*)"/g)]
    .map((m) => m[1]!)
    .filter((v) => /NaN|Infinity/.test(v));

describe("hostile config never reaches the markup", () => {
  // `height`, `step` and `fontSize` are host-computed as often as typed —
  // `Number("")` on a cleared input, a container measured mid-collapse. Each of
  // these painted `d="M9.55 NaN…"` glyphs, an `x2="Infinity"` soil line, or
  // `--mc-label-px: NaNpx` inside a viewBox `Chart` had already clamped to 1.
  const cases = {
    "height=NaN": <SproutRow data={ACCT} height={NaN} />,
    "height=Infinity": <SproutRow data={ACCT} height={Infinity} />,
    "height=-5": <SproutRow data={ACCT} height={-5} />,
    "height=0": <SproutRow data={ACCT} height={0} />,
    "step=NaN": <SproutRow data={ACCT} step={NaN} />,
    "step=Infinity": <SproutRow data={ACCT} step={Infinity} />,
    "step=-4": <SproutRow data={ACCT} step={-4} />,
    "step=0": <SproutRow data={ACCT} step={0} />,
    "fontSize=NaN": <SproutRow data={ACCT} fontSize={NaN} label="value" />,
    "fontSize=-3": <SproutRow data={ACCT} fontSize={-3} labels />,
    "labels + height=NaN": <SproutRow data={ACCT} labels height={NaN} />,
  };

  it("emits no non-finite coordinate, size or custom property", () => {
    for (const [what, ui] of Object.entries(cases)) {
      const bad = nonFinite(draw(ui).container.innerHTML);
      expect(bad, `${what} emitted ${bad.slice(0, 2).join(", ")}`).toEqual([]);
    }
  });

  it("falls back to the documented default, not merely to something finite", () => {
    const plain = draw(<SproutRow data={ACCT} />).container.innerHTML;
    expect(draw(<SproutRow data={ACCT} height={NaN} />).container.innerHTML).toBe(plain);
    expect(draw(<SproutRow data={ACCT} step={0} />).container.innerHTML).toBe(plain);
    expect(draw(<SproutRow data={ACCT} fontSize={-3} />).container.innerHTML).toBe(plain);
  });

  it("a collapsed box sheds the plants rather than painting above the frame", () => {
    const { container } = draw(<SproutRow data={ACCT} height={2} />);
    const svg = container.querySelector("svg")!;
    const h = Number(svg.getAttribute("viewBox")!.split(" ")[3]);
    const soil = svg.querySelector("line")!;
    for (const a of ["y1", "y2"]) {
      const y = Number(soil.getAttribute(a));
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThanOrEqual(h);
    }
    // no negative arc radius survives into a glyph path
    for (const p of svg.querySelectorAll("path")) expect(p.getAttribute("d")).not.toMatch(/a-/);
  });
});

describe("degrades instead of spilling", () => {
  const NAMED = [
    { label: "Acme", value: 3 },
    { label: "Globex", value: 1 },
    { label: "Initech", value: 2 },
  ];

  it("shows names and the stage numeral at the default size", () => {
    const { container } = render(<SproutRow data={NAMED} labels label="value" />);
    const text = [...container.querySelectorAll("text")].map((t) => t.textContent);
    expect(text).toContain("Acme");
    expect(text).toContain("3");
  });

  it("drops the names — and their band — when the glyph would have no room", () => {
    const { container } = render(<SproutRow data={NAMED} labels label="value" height={15} />);
    const text = [...container.querySelectorAll("text")].map((t) => t.textContent);
    expect(text).not.toContain("Acme");
    // the row narrows back to its unlabelled width: the band and side gutter go
    // with the names rather than leaving a hole where the text used to be.
    const vb = container.querySelector("svg")!.getAttribute("viewBox")!;
    const bare = render(<SproutRow data={NAMED} height={15} />)
      .container.querySelector("svg")!
      .getAttribute("viewBox")!;
    expect(vb).toBe(bare);
  });

  it("drops the stage numeral once its descender would clear the floor", () => {
    const { container } = render(<SproutRow data={NAMED} label="value" height={9} />);
    expect([...container.querySelectorAll("text")]).toHaveLength(0);
    // the sprouts themselves still render — degradation sheds text, not data.
    expect(container.querySelectorAll("path").length).toBeGreaterThan(0);
  });
});
