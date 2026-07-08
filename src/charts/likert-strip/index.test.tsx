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

describe("<LikertStrip> (plan/22 #30, S2-ordinal)", () => {
  it("diverging segments + center line; docs-as-tests summary", () => {
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

  it("is axe-clean", async () => {
    const { container } = draw(<LikertStrip data={SURVEY} title="Q1 satisfaction" />);
    await expectNoA11yViolations(container);
  });
});

seriesEdgeSuite("LikertStrip", (data) => (
  <LikertStrip data={data.map((v, i) => ({ label: `L${i}`, value: v }))} title="Edge" />
));
