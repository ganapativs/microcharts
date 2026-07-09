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

describe("<SproutRow> (plan/24 #9)", () => {
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
      const half = (t.textContent!.length * 0.72 * fs) / 2;
      expect(x - half).toBeGreaterThanOrEqual(0);
      expect(x + half).toBeLessThanOrEqual(vbW!);
    }
    // labels stagger onto two tiers, so same-tier centres (two slots apart) are
    // ≥ the widest label extent → no overlap within a tier
    const xs = cats.map((t) => Number(t.getAttribute("x"))).sort((a, b) => a - b);
    const fs = Number(cats[0]!.getAttribute("font-size"));
    const widest = Math.max(...ACCT.map((d) => d.label.length * 0.72 * fs));
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
