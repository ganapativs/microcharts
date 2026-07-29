import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { Funnel } from "./index.js";
import { expectNoA11yViolations } from "../../test/a11y.js";
import { seriesEdgeSuite } from "../../test/edge-cases.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);

const PIPE = [
  { label: "Visitors", value: 12400 },
  { label: "Signups", value: 5704 },
  { label: "Activated", value: 2730 },
  { label: "Paid", value: 1116 },
];

describe("<Funnel>", () => {
  it("stepped columns + slats summary", () => {
    const { container } = draw(<Funnel data={PIPE} />);
    expect(container.querySelectorAll("rect").length).toBe(4);
    // n−1 slats, one path — they carry identical paint and nothing addresses them
    const slats = [...container.querySelectorAll("path")];
    expect(slats.length).toBe(1);
    expect(slats[0]!.getAttribute("d")!.match(/M/g)!.length).toBe(3);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "4 stages, 12,400 to 1,116 — overall 9%.",
    );
  });

  it("non-monotonic funnel renders truthfully + summary notes the inversion", () => {
    const { container } = draw(
      <Funnel
        data={[
          { label: "a", value: 100 },
          { label: "b", value: 40 },
          { label: "c", value: 60 },
        ]}
      />,
    );
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toContain(
      "Stage 3 exceeds stage 2.",
    );
  });

  it("connectors={false} drops the slats", () => {
    const { container } = draw(<Funnel data={PIPE} connectors={false} />);
    expect(container.querySelectorAll("path").length).toBe(0);
  });

  it("highlight accents the leak stage", () => {
    const { container } = draw(<Funnel data={PIPE} highlight="Activated" />);
    const accent = [...container.querySelectorAll("rect")].filter(
      (r) => r.getAttribute("data-mc-ink") === "accent",
    );
    expect(accent.length).toBe(1);
  });

  it("a missing stage keeps its slot in the summary, not a self-conversion", () => {
    const { container } = draw(
      <Funnel
        data={[
          { label: "a", value: -5 },
          { label: "b", value: 10 },
        ]}
      />,
    );
    // Dropping the negative stage announced "1 stage, 10 to 10 — overall 100%"
    // over a two-column chart.
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "2 stages, 0 to 10 — overall 0%. Stage 2 exceeds stage 1.",
    );
  });

  it("a stage with no data drops its percent label instead of painting 0%", () => {
    const { container } = draw(
      <Funnel
        data={[
          { label: "Visitors", value: 12400 },
          { label: "Trials", value: null },
        ]}
        width={120}
      />,
    );
    const texts = [...container.querySelectorAll("text")].map((t) => t.textContent);
    expect(texts).toEqual(["100%"]);
  });

  it("a hostile box falls back to the default instead of leaking into the viewBox", () => {
    const { container } = draw(<Funnel data={PIPE} width={Number.NaN} />);
    const svg = container.querySelector("svg")!;
    expect(svg.getAttribute("viewBox")).toBe("0 0 60 18");
    for (const el of container.querySelectorAll("rect, path")) {
      for (const attr of ["x", "y", "width", "height", "d"]) {
        const v = el.getAttribute(attr);
        if (v !== null) expect(v).not.toMatch(/NaN|Infinity/);
      }
    }
  });

  it("labels drop rather than paint below a short box", () => {
    const { container } = draw(<Funnel data={PIPE} height={4} />);
    expect(container.querySelectorAll("text").length).toBe(0);
    // the gutter goes back to the columns, so the chart still has marks
    expect(container.querySelectorAll("rect").length).toBe(4);
  });

  it("is axe-clean", async () => {
    const { container } = draw(<Funnel data={PIPE} title="Signup funnel" />);
    await expectNoA11yViolations(container);
  });
});

seriesEdgeSuite("Funnel", (data) => (
  <Funnel data={data.map((v, i) => ({ label: `s${i}`, value: v }))} title="Edge" />
));
