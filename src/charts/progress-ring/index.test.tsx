import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { ProgressRing } from "./index.js";
import { expectNoA11yViolations } from "../../test/a11y.js";
import { valueEdgeSuite } from "../../test/edge-cases.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);

describe("<ProgressRing>", () => {
  it("track + value arc; summary reuses the progress wording", () => {
    const { container } = draw(<ProgressRing value={0.68} />);
    expect(container.querySelectorAll("path").length).toBe(2);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe("68% complete.");
  });

  it("sweep mode: remaining wedge + remaining wording", () => {
    const { container } = draw(<ProgressRing value={0.68} sweep />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe("32% remaining.");
  });

  it("label='percent' centers the figure", () => {
    const { container } = draw(<ProgressRing value={0.68} label="percent" size={32} />);
    expect(container.querySelector("text")!.textContent).toBe("68%");
    expect(container.querySelector("text")!.getAttribute("text-anchor")).toBe("middle");
  });

  it("3-digit percent (100%) still clears the inner ring", () => {
    const { container } = draw(<ProgressRing value={1} label="percent" size={32} weight={3} />);
    const text = container.querySelector("text")!;
    expect(text.textContent).toBe("100%");
    const fs = Number(text.getAttribute("font-size"));
    const rInner = 32 / 2 - 0.5 - 3;
    expect((4 * fs * 0.62) / 2).toBeLessThanOrEqual(rInner - 1);
  });

  it("overflow: ring clamps, label tells the truth", () => {
    const { container } = draw(<ProgressRing value={1.12} label="percent" size={32} />);
    expect(container.querySelector("text")!.textContent).toBe("112%");
  });

  it("icon-sized ring drops a 3-digit label instead of colliding", () => {
    const { container } = draw(<ProgressRing value={1} label="percent" size={16} weight={3} />);
    expect(container.querySelector("text")).toBeNull();
    expect(container.querySelectorAll("path").length).toBeGreaterThanOrEqual(1);
  });

  it("sweep prints the REMAINING percent — one glyph, one number", () => {
    // The arc paints 32% and the name says "32% remaining"; the centre figure
    // used to print the 68% that was done.
    const { container } = draw(<ProgressRing value={0.68} sweep label="percent" size={32} />);
    expect(container.querySelector("text")!.textContent).toBe("32%");
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe("32% remaining.");
  });

  it("sweep overflow: nothing left to spend, so the figure reads 0%", () => {
    const { container } = draw(<ProgressRing value={1.4} sweep label="percent" size={32} />);
    expect(container.querySelector("text")!.textContent).toBe("0%");
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe("0% remaining.");
  });

  it("max <= 0 → track only + 'No data.'", () => {
    const { container } = draw(<ProgressRing value={5} max={0} />);
    expect(container.querySelectorAll("path").length).toBe(1);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe("No data.");
  });

  it("node budget ≤ 3", () => {
    const { container } = draw(<ProgressRing value={0.4} label="percent" />);
    expect(container.querySelectorAll("svg *").length).toBeLessThanOrEqual(3);
  });

  // Hostile CONFIG props: `size` and `weight` are scalars a caller can compute,
  // and a non-finite one used to paint a wrong mark (or none) under a perfectly
  // normal accessible name. Announced scale = painted scale.
  describe("hostile config", () => {
    const HOSTILE = [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, 0, -5];

    it.each(HOSTILE)("size=%p falls back to the documented 24-unit box", (size) => {
      const { container } = draw(<ProgressRing value={0.5} size={size} label="percent" />);
      const svg = container.querySelector("svg")!;
      expect(svg.getAttribute("viewBox")).toBe("0 0 24 24");
      // and it still PAINTS: a non-finite radius made every arc builder bail,
      // leaving an empty track under "50% complete."
      expect(container.querySelector('path[data-mc-ink="band"]')!.getAttribute("d")).not.toBe("");
      expect(container.querySelector('path[data-mc-ink="accent"]')).not.toBeNull();
    });

    it.each(HOSTILE)("weight=%p keeps the ring hollow and the arc drawn", (weight) => {
      const { container } = draw(<ProgressRing value={0.5} weight={weight} />);
      // two subpaths = outer rim + punched hole; NaN collapsed this to a disc
      const track = container.querySelector('path[data-mc-ink="band"]')!.getAttribute("d")!;
      expect((track.match(/M/g) ?? []).length).toBe(2);
      expect(container.querySelector('path[data-mc-ink="accent"]')).not.toBeNull();
    });

    it("never emits a non-finite attribute or custom property", () => {
      for (const v of HOSTILE) {
        for (const props of [{ size: v }, { weight: v }]) {
          const { container } = draw(<ProgressRing value={0.5} label="percent" {...props} />);
          expect(container.innerHTML).not.toMatch(/NaN|Infinity/);
        }
      }
    });

    it("a 1-unit box never asks for a negative stroke-width", () => {
      // SVG treats a negative stroke-width as an error and drops the value arc.
      const { container } = draw(<ProgressRing value={0.5} size={1} />);
      for (const el of container.querySelectorAll<SVGElement>("[style]")) {
        const w = el.style.strokeWidth;
        if (w) expect(Number.parseFloat(w)).toBeGreaterThanOrEqual(0);
      }
    });
  });

  it("is axe-clean", async () => {
    const { container } = draw(<ProgressRing value={0.68} title="Sync" />);
    await expectNoA11yViolations(container);
  });
});

valueEdgeSuite("ProgressRing", (value) => (
  <ProgressRing value={value} title="Edge" label="percent" />
));
