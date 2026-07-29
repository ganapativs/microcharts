import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { IconArray } from "./index.js";
import { expectNoA11yViolations } from "../../test/a11y.js";
import { valueEdgeSuite } from "../../test/edge-cases.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);

describe("<IconArray>", () => {
  it("summary states the count and the percent — the docs' real string", () => {
    const { container } = draw(<IconArray value={0.15} total={20} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe("3 in 20. About 15%.");
  });

  it("k filled + (n−k) hollow units; denominator is always countable", () => {
    const { container } = draw(<IconArray value={0.15} total={20} />);
    expect(container.querySelectorAll('[data-mc-ink="accent"]').length).toBe(3);
    expect(container.querySelectorAll('[data-mc-ink="unit-off"]').length).toBe(17);
  });

  it("sub-unit rate is flagged, never faked as a partial fill", () => {
    const { container } = draw(<IconArray value={0.01} total={20} />);
    expect(container.querySelectorAll('[data-mc-ink="accent"]').length).toBe(0);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "0 in 20 (less than 1 in 20). About 0%.",
    );
  });

  it("label modes: ratio (default) vs percent", () => {
    const ratio = draw(<IconArray value={0.15} total={20} />).container;
    const pct = draw(<IconArray value={0.15} total={20} label="percent" />).container;
    expect(ratio.querySelector("text")!.textContent).toBe("3 in 20");
    expect(pct.querySelector("text")!.textContent).toBe("15%");
  });

  it("positive='down' flips the fill ink role to the risk tone", () => {
    const { container } = draw(<IconArray value={0.15} total={20} positive="down" />);
    expect(container.querySelectorAll('[data-mc-ink="negative"]').length).toBe(3);
  });

  it("a custom color stays inline (no token) on top of the unit role", () => {
    const { container } = draw(<IconArray value={0.15} total={20} color="rgb(1, 2, 3)" />);
    const filled = container.querySelector('[data-mc-ink="unit"]')!;
    expect(filled.getAttribute("style")).toContain("rgb(1, 2, 3)");
  });

  it("is axe-clean", async () => {
    const { container } = draw(<IconArray value={0.15} total={20} title="Adverse events" />);
    await expectNoA11yViolations(container);
  });

  // Regression: `total` is typed, but a JS caller / an untyped field / a model
  // emitting the prop reached an unguarded GRID_DIMS lookup and threw
  // "undefined is not iterable". The grid falls back to 20 and says so.
  it("a denominator with no designed grid falls back to 20 instead of throwing", () => {
    const { container } = draw(<IconArray value={0.15} total={7 as never} />);
    expect(container.querySelectorAll("rect").length).toBe(20);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe("3 in 20. About 15%.");
    expect(container.querySelector("text")!.textContent).toBe("3 in 20");
  });

  // Regression: the ratio gutter reserved a flat 9 characters, so "100 in 100"
  // (ten) painted up to 6.7 units past the right edge — and `.mc-root` is
  // overflow: visible, so that lands in the page, not on the cutting-room floor.
  it("the widest ratio label stays inside the viewBox at every denominator", () => {
    for (const [w, h] of [
      [140, 28],
      [120, 60],
      [100, 60],
      [200, 60],
    ] as const) {
      const { container } = draw(<IconArray value={1} total={100} width={w} height={h} />);
      const text = container.querySelector("text");
      if (!text) continue; // the label is allowed to drop; it is not allowed to spill
      expect(text.textContent).toBe("100 in 100");
      const fs = Number(text.getAttribute("font-size"));
      // same per-char over-estimate the reserved gutter is built from
      const end = Number(text.getAttribute("x")) + text.textContent!.length * 0.62 * fs;
      expect(end).toBeLessThanOrEqual(w);
    }
  });

  // tabular-nums is set on `.mc-root text` in styles.css at :where() specificity
  // so a consumer can override it. An inline copy here would win over both.
  it("the label carries no inline paint", () => {
    const { container } = draw(<IconArray value={0.15} total={20} />);
    expect(container.querySelector("text")!.getAttribute("style")).toBeNull();
  });

  // Degradation contract: see tests/craft/floor.mjs.
  it("narrow box: the ratio label drops and the grid reclaims the gutter", () => {
    const big = draw(<IconArray value={0.15} total={20} width={120} height={40} />).container;
    expect(big.querySelector("text")).not.toBeNull();

    // a 9-char gutter would swallow the grid whole at this width
    const small = draw(<IconArray value={0.15} total={20} width={36} height={12} />).container;
    expect(small.querySelector("text")).toBeNull();
    // all 20 countable units still render, and with real area
    const units = [...small.querySelectorAll("rect")];
    expect(units.length).toBe(20);
    expect(Number(units[0]!.getAttribute("width"))).toBeGreaterThan(0.5);
  });
});

valueEdgeSuite("IconArray", (value) => <IconArray value={value} title="Edge" />);
