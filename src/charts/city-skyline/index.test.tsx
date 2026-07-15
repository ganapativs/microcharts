import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { CitySkyline } from "./index.js";
import { expectNoA11yViolations } from "../../test/a11y.js";
import { expectHostsAnnotations } from "../../test/annotation-host.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);
const TEAMS = [
  { label: "Platform", value: 46, lit: 0.7 },
  { label: "Core", value: 32, lit: 0.5 },
  { label: "Web", value: 28, lit: 0.9 },
  { label: "API", value: 40, lit: 0.3 },
  { label: "Data", value: 18, lit: 0.6 },
];

describe("<CitySkyline>", () => {
  it("summary names the count and tallest", () => {
    const { container } = draw(<CitySkyline data={TEAMS} unit="teams" />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "5 teams; tallest Platform at 46.",
    );
  });

  it("renders a tower + a windows path per building + the ground", () => {
    const { container } = draw(<CitySkyline data={TEAMS} />);
    expect(container.querySelectorAll('rect[data-mc-ink="bar"]').length).toBe(5);
    expect(container.querySelectorAll('path[data-mc-ink="accent"]').length).toBe(5);
    expect(container.querySelectorAll("line").length).toBe(1); // ground
  });

  it("omitting lit → a plain bar row (no windows)", () => {
    const { container } = draw(
      <CitySkyline
        data={[
          { label: "A", value: 40 },
          { label: "B", value: 20 },
        ]}
      />,
    );
    expect(container.querySelectorAll('path[data-mc-ink="accent"]').length).toBe(0);
  });

  it("ground={false} drops the baseline", () => {
    const { container } = draw(<CitySkyline data={TEAMS} ground={false} />);
    expect(container.querySelector("line")).toBeNull();
  });

  it("labels + label='value' render text", () => {
    // wide buildings so the labels fit (narrow cells drop long labels — )
    const cats = draw(<CitySkyline data={TEAMS} labels bw={40} />).container;
    expect([...cats.querySelectorAll("text")].map((t) => t.textContent)).toContain("Platform");
    const vals = draw(<CitySkyline data={TEAMS} label="value" />).container;
    expect([...vals.querySelectorAll("text")].map((t) => t.textContent)).toContain("46");
  });

  it("summary={false} hides it from assistive tech", () => {
    const { container } = draw(<CitySkyline data={TEAMS} summary={false} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBeNull();
  });

  it("is axe-clean", async () => {
    const { container } = draw(<CitySkyline data={TEAMS} title="Team sizes" />);
    await expectNoA11yViolations(container);
  });

  it("hosts annotations (marks drawn + clamped in frame)", () => {
    // width derives from geometry: 5 buildings, bw=9 gap=3 pad=2 → 61
    expectHostsAnnotations(
      (children) => (
        <CitySkyline data={TEAMS} bw={9} gap={3} height={24} summary={false}>
          {children}
        </CitySkyline>
      ),
      61,
      24,
    );
  });
});
