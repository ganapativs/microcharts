import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { LikertStrip } from "./index.js";
import { expectNoA11yViolations } from "../../test/a11y.js";
import { seriesEdgeSuite } from "../../test/edge-cases.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);

// 5 levels: strong-disagree → strong-agree, 62% agree / 24% disagree / 14% neutral
const SURVEY = [
  { label: "Strongly disagree", value: 10 },
  { label: "Disagree", value: 14 },
  { label: "Neutral", value: 14 },
  { label: "Agree", value: 34 },
  { label: "Strongly agree", value: 28 },
];

describe("<LikertStrip>", () => {
  it("diverging segments + center line summary", () => {
    const { container } = draw(<LikertStrip data={SURVEY} />);
    expect(container.querySelector("line")).not.toBeNull();
    expect(container.querySelectorAll("rect").length).toBe(5);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "62% agree, 24% disagree, 14% neutral. Leans positive.",
    );
  });

  it("neutral='omit' → 4 bar segments, neutral still in the summary", () => {
    const { container } = draw(<LikertStrip data={SURVEY} neutral="omit" />);
    expect(container.querySelectorAll("rect").length).toBe(4);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toContain("14% neutral");
  });

  it("balanced rows read 'Balanced.' (|net| < 5 pts)", () => {
    const { container } = draw(
      <LikertStrip
        data={[
          { label: "d", value: 49 },
          { label: "a", value: 51 },
        ]}
      />,
    );
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toContain("Balanced.");
  });

  it("all-neutral → 'All responses neutral.'; zero total → 'No responses.'", () => {
    const allNeu = draw(
      <LikertStrip
        data={[
          { label: "d", value: 0 },
          { label: "n", value: 10 },
          { label: "a", value: 0 },
        ]}
      />,
    ).container;
    expect(allNeu.querySelector("svg")!.getAttribute("aria-label")).toBe("All responses neutral.");
    const empty = draw(
      <LikertStrip
        data={[
          { label: "d", value: 0 },
          { label: "a", value: 0 },
        ]}
      />,
    ).container;
    expect(empty.querySelector("svg")!.getAttribute("aria-label")).toBe("No responses.");
  });

  it("label='ends' renders disagree/agree percents in the gutters", () => {
    const { container } = draw(<LikertStrip data={SURVEY} width={90} />);
    const texts = [...container.querySelectorAll("text")].map((t) => t.textContent);
    expect(texts).toContain("24%");
    expect(texts).toContain("62%");
  });

  it("a non-finite width lays out against the box <Chart> paints, not NaN", () => {
    // `width={NaN}` (a size read off an unmounted element) drew the center line
    // and both end labels at x="NaN" under a clean viewBox and a correct name.
    const { container } = draw(<LikertStrip data={SURVEY} width={NaN} />);
    const svg = container.querySelector("svg")!;
    expect(svg.getAttribute("viewBox")).toBe("0 0 1 14");
    const attrs = [...svg.querySelectorAll("*")].flatMap((el) =>
      [...el.attributes].map((a) => a.value),
    );
    expect(attrs.filter((v) => /NaN|Infinity/.test(v))).toEqual([]);
    expect(svg.getAttribute("style")).not.toMatch(/NaN/);
    expect(svg.getAttribute("aria-label")).toContain("62% agree");
  });

  it("a box too narrow for the end labels drops them and gives the bar the width", () => {
    // Two 22-unit reserves in a 40-unit box left every segment negative-width:
    // no bar at all, and "24%"/"62%" painted over each other in the middle.
    const { container } = draw(<LikertStrip data={SURVEY} width={40} />);
    expect(container.querySelectorAll("text").length).toBe(0);
    const rects = [...container.querySelectorAll("rect")];
    expect(rects.length).toBe(5);
    expect(rects[0]!.getAttribute("x")).toBe("0");
    const last = rects[4]!;
    expect(Number(last.getAttribute("x")) + Number(last.getAttribute("width"))).toBeCloseTo(40, 2);
  });

  it("a format that returns prose drops the labels rather than painting past the box", () => {
    const { container } = draw(
      <LikertStrip data={SURVEY} width={90} format={(n) => `${n * 100} percent`} />,
    );
    expect(container.querySelectorAll("text").length).toBe(0);
    expect(container.querySelectorAll("rect").length).toBe(5);
    // the reserve is gone with the label, so the bar owns the full box
    expect(container.querySelector("rect")!.getAttribute("x")).toBe("0");
  });

  it("label='net' localises the score digits, keeping the typographic sign", () => {
    const en = draw(<LikertStrip data={SURVEY} label="net" width={90} />).container;
    expect(en.querySelector("text")!.textContent).toBe("+38");
    const ar = draw(<LikertStrip data={SURVEY} label="net" width={90} locale="ar-EG" />).container;
    // the summary was already in Arabic-Indic digits; the painted score was not
    expect(ar.querySelector("text")!.textContent).toBe("+٣٨");
  });

  it("is axe-clean", async () => {
    const { container } = draw(<LikertStrip data={SURVEY} title="Q1 satisfaction" />);
    await expectNoA11yViolations(container);
  });
});

seriesEdgeSuite("LikertStrip", (data) => (
  <LikertStrip data={data.map((v, i) => ({ label: `L${i}`, value: v }))} title="Edge" />
));
