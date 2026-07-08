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

describe("<DotPlot> (plan/22 #10, S2)", () => {
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
    expect(texts).toContain("Amster…");
    expect(texts).toContain("Oslo");
  });

  it("stem renders hairlines from zero", () => {
    const { container } = draw(<DotPlot data={DATA} stem />);
    expect(container.querySelectorAll("line").length).toBe(3);
  });

  it("highlight accents one category's dot", () => {
    const { container } = draw(<DotPlot data={DATA} highlight="Sam" />);
    const dots = [...container.querySelectorAll("circle")];
    expect((dots[2] as SVGElement).style.fill).toBe("var(--mc-accent)");
  });

  it("labels drop deterministically with density (values < 8-unit rows, categories < 7.5)", () => {
    const tall = draw(<DotPlot data={DATA} label="value" height={40} />).container;
    expect(tall.querySelectorAll("text").length).toBe(6); // categories + values
    const short = draw(<DotPlot data={DATA} label="value" height={18} />).container;
    expect(short.querySelectorAll("text").length).toBe(0); // too dense for any text
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
