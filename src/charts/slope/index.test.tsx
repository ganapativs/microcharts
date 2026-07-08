import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { Slope } from "./index.js";
import { expectNoA11yViolations } from "../../test/a11y.js";
import { seriesEdgeSuite } from "../../test/edge-cases.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);

const DATA = [
  { label: "East", from: 40, to: 47 },
  { label: "West", from: 55, to: 41 },
  { label: "South", from: 30, to: 33 },
  { label: "North", from: 50, to: 44 },
  { label: "Mid", from: 20, to: 35 },
];

describe("<Slope> (plan/22 #13, S2-paired)", () => {
  it("one line + endpoint dots per category; docs-as-tests summary", () => {
    const { container } = draw(<Slope data={DATA} />);
    expect(container.querySelectorAll("line").length).toBe(5);
    expect(container.querySelectorAll("circle").length).toBe(10);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "5 categories: 3 up, 2 down. Largest change Mid, up 75%.",
    );
  });

  it("neutral ink by default; positive engages direction tokens", () => {
    const plain = draw(<Slope data={DATA.slice(0, 2)} />).container;
    expect(plain.querySelector("line")!.getAttribute("stroke")).toBe("var(--mc-neutral)");
    const valenced = draw(<Slope data={DATA.slice(0, 2)} positive="up" />).container;
    const strokes = [...valenced.querySelectorAll("line")].map((l) => l.getAttribute("stroke"));
    expect(strokes).toContain("var(--mc-positive)");
    expect(strokes).toContain("var(--mc-negative)");
  });

  it("highlight → accent + heavier stroke", () => {
    const { container } = draw(<Slope data={DATA} highlight="West" />);
    const lines = [...container.querySelectorAll("line")];
    expect(lines[1]!.getAttribute("stroke")).toBe("var(--mc-accent)");
  });

  it("missing end → dashed stub (incomplete)", () => {
    const { container } = draw(<Slope data={[{ label: "a", from: Number.NaN, to: 5 }]} />);
    const stub = container.querySelector("line")!;
    expect(stub.getAttribute("stroke-dasharray")).not.toBeNull();
    expect(container.querySelectorAll("circle").length).toBe(1);
  });

  it("labels drop deterministically when rows are cramped", () => {
    const spacious = draw(<Slope data={DATA.slice(0, 2)} label="value" height={40} />).container;
    expect(spacious.querySelectorAll("text").length).toBeGreaterThan(0);
    const cramped = draw(<Slope data={DATA} label="value" height={24} />).container;
    expect(cramped.querySelectorAll("text").length).toBe(0);
  });

  it("is axe-clean", async () => {
    const { container } = draw(<Slope data={DATA} title="Before vs after" />);
    await expectNoA11yViolations(container);
  });
});

seriesEdgeSuite("Slope", (data) => (
  <Slope
    data={data.map((v, i) => ({ label: `c${i}`, from: v ?? Number.NaN, to: (v ?? 0) * 1.3 }))}
    title="Edge"
  />
));
