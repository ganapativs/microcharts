import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { CitySkyline, citySkylineSummary } from "./index.js";
import { expectNoA11yViolations } from "../../test/a11y.js";
import { expectHostsAnnotations } from "../../test/annotation-host.js";
import { mappedEdgeSuite } from "../../test/edge-cases.js";

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

  describe("degenerate values", () => {
    it("an unmeasured group can't be the tallest, but still counts", () => {
      expect(
        citySkylineSummary(
          [{ label: "Platform", value: null as unknown as number }, ...TEAMS.slice(1)],
          { unit: "teams" },
        ),
      ).toBe("5 teams; tallest API at 40.");
    });

    it("nothing measured reads as no data, never as NaN or ∞", () => {
      expect(
        citySkylineSummary(TEAMS.map((d) => ({ ...d, value: null as unknown as number }))),
      ).toBe("No data.");
      expect(
        citySkylineSummary(TEAMS.map((d) => ({ ...d, value: Number.NEGATIVE_INFINITY }))),
      ).toBe("No data.");
    });

    it("label='value' prints no numeral for an unmeasured group (empty ≠ zero)", () => {
      const { container } = draw(
        <CitySkyline
          data={[
            { label: "A", value: 40 },
            { label: "B", value: null as unknown as number },
          ]}
          label="value"
        />,
      );
      expect([...container.querySelectorAll("text")].map((t) => t.textContent)).toEqual(["40"]);
    });

    it("all-unmeasured still draws the ground line — empty is visible", () => {
      const { container } = draw(
        <CitySkyline data={TEAMS.map((d) => ({ ...d, value: null as unknown as number }))} />,
      );
      expect(container.querySelectorAll("line").length).toBe(1);
    });
  });
});

// `lit` rides the same degenerate value as `value` so the secondary channel's
// clamp is exercised too — `Math.max(0, NaN)` is NaN, which used to reach the
// interactive readout's lit percent.
mappedEdgeSuite(
  "CitySkyline",
  (v, i) => ({ label: `g${i}`, value: v as number, lit: v ?? undefined }),
  (data) => <CitySkyline data={data} label="value" labels bw={40} title="Edge" unit="teams" />,
);
