import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { DicePips } from "./index.js";
import { expectNoA11yViolations } from "../../test/a11y.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);
/** Estimated painted run of a `<text>`, on the library's own per-char figure. */
const runOf = (t: Element) => t.textContent!.length * 0.62 * Number(t.getAttribute("font-size"));

describe("<DicePips>", () => {
  it("summary is the real string: '{n} out of 6.'", () => {
    const { container } = draw(<DicePips value={4} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe("4 out of 6.");
  });

  it("draws the face + `value` pips", () => {
    const { container } = draw(<DicePips value={5} />);
    expect(container.querySelectorAll("rect").length).toBe(1); // the face
    expect(container.querySelectorAll('circle[data-mc-ink="point"]').length).toBe(5);
  });

  it("face={false} drops the outline", () => {
    const { container } = draw(<DicePips value={3} face={false} />);
    expect(container.querySelector("rect")).toBeNull();
    expect(container.querySelectorAll("circle").length).toBe(3);
  });

  it("0 → empty face, '0 out of 6.'", () => {
    const { container } = draw(<DicePips value={0} />);
    expect(container.querySelectorAll("circle").length).toBe(0);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe("0 out of 6.");
  });

  it("> 6 → centered numeral, summary drops the frame", () => {
    const { container } = draw(<DicePips value={9} />);
    expect(container.querySelector("text")!.textContent).toBe("9");
    expect(container.querySelectorAll("circle").length).toBe(0);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe("9.");
  });

  it("negatives are invalid → 'No data.'", () => {
    const { container } = draw(<DicePips value={-1} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe("No data.");
  });

  it("summary={false} hides it from assistive tech", () => {
    const { container } = draw(<DicePips value={4} summary={false} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBeNull();
  });

  // Containment: `.mc-root` is overflow:visible, so a numeral wider than the
  // face lands on the page, not on the cutting-room floor.
  it("the fallback numeral is shrunk to fit across the face, then dropped", () => {
    // 1–2 digits keep the full 10-unit setting at the default box.
    for (const v of [9, 42]) {
      const t = draw(<DicePips value={v} />).container.querySelector("text")!;
      expect(t.getAttribute("font-size")).toBe("10");
      expect(runOf(t)).toBeLessThanOrEqual(15);
    }

    // 3 digits shrink rather than spill; the estimated run stays inside the face.
    const three = draw(<DicePips value={120} />).container.querySelector("text")!;
    expect(Number(three.getAttribute("font-size"))).toBeLessThan(10);
    expect(runOf(three)).toBeLessThanOrEqual(15);

    // Past the 7-unit floor the numeral drops; the summary keeps the count.
    const { container } = draw(<DicePips value={123456} />);
    expect(container.querySelector("text")).toBeNull();
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe("123456.");
  });

  it("a non-physical `size` renders the default box, never NaN attributes", () => {
    for (const bad of [NaN, Infinity]) {
      const svg = draw(<DicePips value={4} size={bad} />).container.querySelector("svg")!;
      expect(svg.getAttribute("viewBox")).toBe("0 0 16 16");
      expect(svg.outerHTML).not.toMatch(/NaN|Infinity/);
    }
    const neg = draw(<DicePips value={4} size={-20} />).container.querySelector("svg")!;
    expect(neg.getAttribute("viewBox")).toBe("0 0 1 1");
    expect(neg.querySelector("rect")!.getAttribute("width")).toBe("0");
  });

  it("is axe-clean", async () => {
    const { container } = draw(<DicePips value={4} title="Severity" />);
    await expectNoA11yViolations(container);
  });
});
