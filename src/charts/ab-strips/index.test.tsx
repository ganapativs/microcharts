import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { ABStrips } from "./index.js";
import { expectNoA11yViolations } from "../../test/a11y.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);
// B centered lower than A (a latency win)
const A = Array.from({ length: 60 }, (_, i) => 130 + ((i * 7) % 30) - 15);
const B = Array.from({ length: 60 }, (_, i) => 118 + ((i * 7) % 30) - 15);

describe("<ABStrips> (plan/23 #13)", () => {
  it("summary states medians, delta, and overlap — the real string", () => {
    const { container } = draw(<ABStrips data={{ a: A, b: B }} />);
    // exact string pinned by the render (docs-as-tests)
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toMatch(
      /^B median [\d.]+ vs A [\d.]+ \(-9%\); middle halves overlap \d+%\./,
    );
  });

  it("identical arms → overlap 100%, 'No clear difference'", () => {
    const { container } = draw(<ABStrips data={{ a: A, b: A }} />);
    const label = container.querySelector("svg")!.getAttribute("aria-label")!;
    expect(label).toContain("overlap 100%");
    expect(label).toContain("No clear difference");
  });

  it("disjoint arms → overlap 0%, 'Clearly separated'", () => {
    const lo = Array.from({ length: 40 }, (_, i) => 10 + (i % 5));
    const hi = Array.from({ length: 40 }, (_, i) => 90 + (i % 5));
    const { container } = draw(<ABStrips data={{ a: lo, b: hi }} />);
    const label = container.querySelector("svg")!.getAttribute("aria-label")!;
    expect(label).toContain("overlap 0%");
    expect(label).toContain("Clearly separated");
  });

  it("two rows: outer + inner band + median dot each, plus A/B tags", () => {
    const { container } = draw(<ABStrips data={{ a: A, b: B }} />);
    // row A is neutral ink, row B is accent ink (no custom `color` here) — each
    // row's outer+inner rects live inside a `<g>`, unlike the contested-zone rect
    expect(container.querySelectorAll('g > rect[data-mc-ink="neutral"]').length).toBe(2); // A
    expect(container.querySelectorAll('g > rect[data-mc-ink="accent"]').length).toBe(2); // B
    expect(container.querySelectorAll("circle").length).toBe(2); // medians
    const tags = [...container.querySelectorAll("text")].map((t) => t.textContent);
    expect(tags).toContain("A");
    expect(tags).toContain("B");
  });

  it("custom labels flow into tags + summary", () => {
    const { container } = draw(<ABStrips data={{ a: A, b: B }} labels={["Ctrl", "Test"]} />);
    const label = container.querySelector("svg")!.getAttribute("aria-label")!;
    expect(label).toMatch(/^Test median/);
    expect([...container.querySelectorAll("text")].map((t) => t.textContent)).toContain("Ctrl");
  });

  it("label='none' hides the delta gutter text (tags remain)", () => {
    const none = draw(<ABStrips data={{ a: A, b: B }} label="none" />).container;
    const texts = [...none.querySelectorAll("text")].map((t) => t.textContent);
    expect(texts).toEqual(["A", "B"]); // only the row tags
  });

  it("is axe-clean", async () => {
    const { container } = draw(<ABStrips data={{ a: A, b: B }} title="Latency A/B" />);
    await expectNoA11yViolations(container);
  });
});
