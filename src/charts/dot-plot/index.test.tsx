import { describe, it, expect, vi, afterEach } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { DotPlot } from "./index.js";
import { expectNoA11yViolations } from "../../test/a11y.js";
import { seriesEdgeSuite } from "../../test/edge-cases.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);

const DATA = [
  { label: "Ada", value: 96 },
  { label: "Kim", value: 41 },
  { label: "Sam", value: 88 },
];

afterEach(() => {
  vi.restoreAllMocks();
});

describe("<DotPlot>", () => {
  it("one dot + label per row; summary is the docs' real string", () => {
    const { container } = draw(<DotPlot data={DATA} />);
    expect(container.querySelectorAll("circle").length).toBe(3);
    expect(container.querySelectorAll("text").length).toBe(3);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "3 categories. Highest Ada 96, lowest Kim 41.",
    );
  });

  it("labels truncate by character count with an ellipsis", () => {
    const { container } = draw(
      <DotPlot
        data={[
          { label: "Amsterdam", value: 5 },
          { label: "Oslo", value: 3 },
        ]}
      />,
    );
    const texts = [...container.querySelectorAll("text")].map((t) => t.textContent);
    // Truncated to what the gutter can actually PAY for at the 60-unit default,
    // not to a fixed count. This used to force 6 characters whether they fit or
    // not, which is the same containment hazard the shared row-label budget
    // exists to prevent — `.mc-root` is overflow: visible, so an over-long name
    // paints into the page rather than clipping.
    expect(texts).toContain("Amst…");
    expect(texts).toContain("Oslo");
    // Wider box, more of the name — the budget tracks the room.
    const wide = draw(<DotPlot data={[{ label: "Amsterdam", value: 5 }]} width={200} />);
    expect([...wide.container.querySelectorAll("text")].map((t) => t.textContent)).toContain(
      "Amsterdam",
    );
  });

  it("stem renders hairlines from zero", () => {
    const { container } = draw(<DotPlot data={DATA} stem />);
    expect(container.querySelectorAll("line").length).toBe(3);
  });

  it("highlight accents one category's dot", () => {
    const { container } = draw(<DotPlot data={DATA} highlight="Sam" />);
    const dots = [...container.querySelectorAll("circle")];
    expect((dots[2] as SVGElement).getAttribute("data-mc-ink")).toBe("accent");
  });

  it("labels drop deterministically with density (values < 8-unit rows, categories < 7.5)", () => {
    const tall = draw(<DotPlot data={DATA} label="value" height={40} />).container;
    expect(tall.querySelectorAll("text").length).toBe(6); // categories + values
    const short = draw(<DotPlot data={DATA} label="value" height={18} />).container;
    expect(short.querySelectorAll("text").length).toBe(0); // too dense for any text
  });

  it("a null row keeps its category name (the dot is what's missing)", () => {
    const { container } = draw(
      <DotPlot
        data={[
          { label: "Ada", value: 96 },
          { label: "Kim", value: null },
          { label: "Sam", value: 88 },
        ]}
        height={40}
      />,
    );
    expect(container.querySelectorAll("circle").length).toBe(2);
    expect([...container.querySelectorAll("text")].map((t) => t.textContent)).toEqual([
      "Ada",
      "Kim",
      "Sam",
    ]);
  });

  it("a value that fits neither side of its dot drops rather than spilling", () => {
    const { container } = draw(
      <DotPlot
        data={[
          { label: "a", value: -999999999 },
          { label: "b", value: 1 },
        ]}
        label="value"
        height={40}
      />,
    );
    const texts = [...container.querySelectorAll("text")];
    // "-999,999,999" is wider than the whole plot: start-anchored it runs past
    // the viewBox, end-anchored it runs past x=0. It drops; "1" still renders.
    expect(texts.map((t) => t.textContent)).toEqual(["a", "b", "1"]);
    // and every text that DID render stays inside the 60-unit viewBox
    for (const t of texts) {
      const x = Number(t.getAttribute("x"));
      const est = t.textContent!.length * 10 * 0.62;
      const left = t.getAttribute("text-anchor") === "end" ? x - est : x;
      expect(left).toBeGreaterThanOrEqual(0);
      expect(left + est).toBeLessThanOrEqual(60);
    }
  });

  it("value labels take the label ink role (quiet, and mapped in forced-colors)", () => {
    const { container } = draw(<DotPlot data={DATA} label="value" height={40} />);
    const inks = [...container.querySelectorAll("text")].map((t) => t.getAttribute("data-mc-ink"));
    expect(inks.length).toBe(6);
    expect(inks.every((i) => i === "label")).toBe(true);
  });

  it("> 7 rows → dev warning", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    draw(<DotPlot data={Array.from({ length: 8 }, (_, i) => ({ label: `c${i}`, value: i }))} />);
    expect(warn).toHaveBeenCalledOnce();
  });

  it("is axe-clean", async () => {
    const { container } = draw(<DotPlot data={DATA} title="Team scores" />);
    await expectNoA11yViolations(container);
  });
});

seriesEdgeSuite("DotPlot", (data) => (
  <DotPlot data={data.map((v, i) => ({ label: `c${i}`, value: v }))} title="Edge" label="value" />
));
