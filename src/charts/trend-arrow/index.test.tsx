import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { TrendArrow } from "./index.js";
import { expectNoA11yViolations } from "../../test/a11y.js";
import { valueEdgeSuite } from "../../test/edge-cases.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);

const pathOf = (c: HTMLElement) => c.querySelector(".mc-trend path")!.getAttribute("d")!;
const inkOf = (c: HTMLElement) => c.querySelector(".mc-trend path")!.getAttribute("data-mc-ink");

describe("<TrendArrow>", () => {
  it("positive → up glyph + positive ink; negative → distinct down glyph + negative ink", () => {
    const up = draw(<TrendArrow value={0.12} />).container;
    const down = draw(<TrendArrow value={-0.12} />).container;
    expect(pathOf(up)).not.toBe(pathOf(down));
    expect(inkOf(up)).toBe("positive");
    expect(inkOf(down)).toBe("negative");
  });

  it("zero → flat glyph, neutral ink, 'No change.'", () => {
    const { container } = draw(<TrendArrow value={0} />);
    expect(inkOf(container)).toBe("neutral");
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe("No change.");
  });

  it("|value| ≤ flatBand → flat (declared noise floor)", () => {
    const flat = draw(<TrendArrow value={0.01} flatBand={0.02} />).container;
    const moving = draw(<TrendArrow value={0.03} flatBand={0.02} />).container;
    expect(inkOf(flat)).toBe("neutral");
    expect(inkOf(moving)).toBe("positive");
  });

  it("negative flatBand is treated as 0", () => {
    const { container } = draw(<TrendArrow value={0.01} flatBand={-5} />);
    expect(inkOf(container)).toBe("positive");
  });

  it("positive='down' flips ink, never the glyph", () => {
    const up = draw(<TrendArrow value={0.1} />).container;
    const upBad = draw(<TrendArrow value={0.1} positive="down" />).container;
    expect(pathOf(upBad)).toBe(pathOf(up)); // same direction shape
    expect(inkOf(upBad)).toBe("negative"); // flipped valence
  });

  it("summary: 'Up 12%.' — the docs' real string", () => {
    const { container } = draw(
      <TrendArrow value={0.12} format={{ style: "percent", maximumFractionDigits: 0 }} />,
    );
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe("Up 12%.");
  });

  it("non-finite → flat glyph, neutral ink, 'No data.'", () => {
    const { container } = draw(<TrendArrow value={Number.NaN} />);
    expect(inkOf(container)).toBe("neutral");
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe("No data.");
  });

  it("glyph variants render distinct shapes; node budget ≤ 2", () => {
    const shapes = (["arrow", "triangle", "chevron"] as const).map((glyph) =>
      pathOf(draw(<TrendArrow value={1} glyph={glyph} />).container),
    );
    expect(new Set(shapes).size).toBe(3);
    const { container } = draw(<TrendArrow value={1} showValue />);
    expect(container.querySelectorAll("svg *").length).toBeLessThanOrEqual(2);
  });

  it("an unknown glyph renders the arrow rather than crashing the tree", () => {
    const arrow = draw(<TrendArrow value={1} glyph="arrow" />).container;
    // `glyph` is typed, but arrives untyped off JSON config; "constructor" used
    // to resolve through Object.prototype and throw inside geometry.
    for (const bogus of ["blob", "constructor", "__proto__"]) {
      const { container } = draw(<TrendArrow value={1} glyph={bogus as "arrow"} />);
      expect(pathOf(container), bogus).toBe(pathOf(arrow));
    }
  });

  it("showValue → widened viewBox with the value in a right gutter (containment)", () => {
    const { container } = draw(<TrendArrow value={42} showValue />);
    const svg = container.querySelector("svg")!;
    const text = container.querySelector("text")!;
    // The label ink role carries the forced-colors mapping (CanvasText); the
    // bare `.mc-root text` fallback is a literal hex that survives HCM.
    expect(text.getAttribute("data-mc-ink")).toBe("label");
    const [, , w] = svg.getAttribute("viewBox")!.split(" ").map(Number);
    expect(w!).toBeGreaterThan(16);
    expect(text.textContent).toBe("42");
    const fontSize = Number(text.getAttribute("font-size"));
    const estEnd = Number(text.getAttribute("x")) + text.textContent!.length * fontSize * 0.62;
    expect(estEnd).toBeLessThanOrEqual(w!);
  });

  it("summary={false} → decorative", () => {
    const { container } = draw(<TrendArrow value={0.1} summary={false} />);
    expect(container.querySelector("svg")!.getAttribute("aria-hidden")).toBe("true");
  });

  it("is axe-clean", async () => {
    const { container } = draw(<TrendArrow value={0.12} title="Weekly change" showValue />);
    await expectNoA11yViolations(container);
  });
});

valueEdgeSuite("TrendArrow", (value) => <TrendArrow value={value} title="Edge" showValue />);
