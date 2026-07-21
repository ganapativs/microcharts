import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { ABStrips } from "./index.js";
import { expectNoA11yViolations } from "../../test/a11y.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);
// B centered lower than A (a latency win)
const A = Array.from({ length: 60 }, (_, i) => 130 + ((i * 7) % 30) - 15);
const B = Array.from({ length: 60 }, (_, i) => 118 + ((i * 7) % 30) - 15);

describe("<ABStrips>", () => {
  it("summary states medians, delta, and overlap — the real string", () => {
    const { container } = draw(<ABStrips data={{ a: A, b: B }} />);
    // exact string pinned by the render
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
    // row A's bands carry the neutral ink role; row B's bands are accent-COLORED
    // via a plain fill (no accent ink role, so the entrance keeps them out of the
    // late "voice" act). Each row's outer+inner rects live inside a `<g>`, unlike
    // the contested-zone rect.
    expect(container.querySelectorAll('g > rect[data-mc-ink="neutral"]').length).toBe(2); // A
    const bRects = [...container.querySelectorAll("g > rect")].filter(
      (r) => r.getAttribute("fill") === "var(--mc-accent)",
    );
    expect(bRects.length).toBe(2); // B — accent fill, no accent ink
    expect(container.querySelectorAll('rect[data-mc-ink="accent"]').length).toBe(0);
    // the accent voice stays with B's median dot
    expect(container.querySelectorAll('circle[data-mc-ink="accent"]').length).toBe(1);
    expect(container.querySelectorAll("circle").length).toBe(2); // medians
    const tags = [...container.querySelectorAll("text")].map((t) => t.textContent);
    expect(tags).toContain("A");
    expect(tags).toContain("B");
  });

  it("custom seriesLabels flow into tags + summary", () => {
    const { container } = draw(<ABStrips data={{ a: A, b: B }} seriesLabels={["Ctrl", "Test"]} />);
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

describe("<ABStrips> degrades at small sizes", () => {
  const A = [100, 110, 120, 130, 140, 150, 160, 170];
  const B = [120, 130, 140, 150, 160, 170, 180, 190];
  const at = (height: number, props = {}) =>
    draw(<ABStrips data={{ a: A, b: B }} width={160} height={height} {...props} />).container;
  const texts = (c: Element) => [...c.querySelectorAll("text")].map((t) => t.textContent);

  // labelFont floors at 7, so tags need band ≥ 7 → height ≥ 18
  // ((h − 2pad) / 2). Below that the tags drop; strips + delta survive.
  it("keeps the row tags while the row pitch holds one em (height 18 → pitch 7)", () => {
    expect(texts(at(18))).toEqual(["A", "B", "+15%"]);
  });

  it("drops the row tags below one em — the strips and the delta survive", () => {
    const c = at(17);
    expect(texts(c)).toEqual(["+15%"]);
    expect(c.querySelectorAll("circle").length).toBe(2);
  });

  it("longer row identities drop at the same pitch, never overlap", () => {
    expect(texts(at(17, { seriesLabels: ["Ctrl", "Test"] }))).toEqual(["+15%"]);
  });

  it("the tags' lead gutter goes with them — the strips reclaim the width", () => {
    const outerX = (h: number) => Number([...at(h).querySelectorAll("rect")][0]!.getAttribute("x"));
    expect(outerX(17)).toBeLessThan(outerX(18));
  });
});
