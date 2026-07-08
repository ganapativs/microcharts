import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { Dumbbell } from "./index.js";
import { expectNoA11yViolations } from "../../test/a11y.js";
import { seriesEdgeSuite } from "../../test/edge-cases.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);

describe("<Dumbbell> (plan/22 #11, S2-paired)", () => {
  it("single row: connector + hollow from-dot + filled to-dot; docs-as-tests summary", () => {
    const { container } = draw(<Dumbbell data={[{ from: 62000, to: 84000 }]} />);
    expect(container.querySelector("line")).not.toBeNull();
    const circles = [...container.querySelectorAll("circle")];
    expect(circles.length).toBe(2);
    expect(circles[0]!.getAttribute("fill")).toBe("none"); // hollow from
    expect(circles[1]!.getAttribute("data-mc-ink")).toBe("point"); // filled to
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "From 62,000 to 84,000, up 35%.",
    );
  });

  it("from === to → single dot, no connector, 'No change at 62,000.'", () => {
    const { container } = draw(<Dumbbell data={[{ from: 62000, to: 62000 }]} />);
    expect(container.querySelector("line")).toBeNull();
    expect(container.querySelectorAll("circle").length).toBe(1);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe("No change at 62,000.");
  });

  it("multi-row leads with the largest change", () => {
    const { container } = draw(
      <Dumbbell
        data={[
          { label: "Paris", from: 50, to: 55 },
          { label: "Berlin", from: 48, to: 68 },
        ]}
      />,
    );
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "2 rows. Largest change Berlin, up 42%.",
    );
  });

  it("positive colors the connector by direction; without it stays neutral", () => {
    const up = draw(<Dumbbell data={[{ from: 10, to: 20 }]} positive="up" />).container;
    expect((up.querySelector("line") as SVGElement).style.stroke).toBe("var(--mc-positive)");
    const range = draw(<Dumbbell data={[{ from: 10, to: 20 }]} />).container;
    expect((range.querySelector("line") as SVGElement).style.stroke).toBe("");
  });

  it("label='value' renders from/to outside the dots when they fit", () => {
    const { container } = draw(
      <Dumbbell data={[{ from: 40, to: 60 }]} width={120} label="value" domain={[0, 100]} />,
    );
    const texts = [...container.querySelectorAll("text")].map((t) => t.textContent);
    expect(texts).toContain("40");
    expect(texts).toContain("60");
  });

  it("is axe-clean", async () => {
    const { container } = draw(
      <Dumbbell data={[{ label: "Berlin", from: 48, to: 68 }]} title="Salary band moves" />,
    );
    await expectNoA11yViolations(container);
  });
});

seriesEdgeSuite("Dumbbell", (data) => (
  <Dumbbell
    data={data.map((v, i) => ({ label: `c${i}`, from: v ?? Number.NaN, to: (v ?? 0) * 1.2 }))}
    title="Edge"
  />
));
