import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { Slope } from "./index.js";
import { expectNoA11yViolations } from "../../test/a11y.js";
import { mappedEdgeSuite } from "../../test/edge-cases.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);

const DATA = [
  { label: "East", from: 40, to: 47 },
  { label: "West", from: 55, to: 41 },
  { label: "South", from: 30, to: 33 },
  { label: "North", from: 50, to: 44 },
  { label: "Mid", from: 20, to: 35 },
];

describe("<Slope>", () => {
  it("one line + endpoint dots per category summary", () => {
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

// Both endpoints are encoded, so both take the degenerate value unlaundered.
// The previous spelling wrote `to: (v ?? 0) * 1.3`, which turned every missing
// end into a measured zero and kept NaN/±Infinity out of the right column
// entirely. `label="both"` renders the formatted endpoints, where the leaks are.
// One suite per endpoint keeps the other column finite, so each column's guard
// is exercised alone rather than short-circuited by its neighbour, and every
// matrix value reaches both `from` and `to`.
const slopeCase = (data: readonly { label: string; from: number; to: number }[]) => (
  <Slope data={data} label="both" title="Edge" width={120} height={60} />
);
mappedEdgeSuite(
  "Slope (degenerate from)",
  (v, i) => ({ label: `c${i}`, from: v as number, to: i }),
  slopeCase,
);
mappedEdgeSuite(
  "Slope (degenerate to)",
  (v, i) => ({ label: `c${i}`, from: i, to: v as number }),
  slopeCase,
);
