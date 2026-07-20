import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { BubbleRow } from "./index.js";
import { expectNoA11yViolations } from "../../test/a11y.js";
import { mappedEdgeSuite } from "../../test/edge-cases.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);
const REGIONS = [
  { label: "EMEA", value: 1240 },
  { label: "AMER", value: 890 },
  { label: "APAC", value: 560 },
  { label: "LATAM", value: 210 },
] as const;

describe("<BubbleRow>", () => {
  it("summary names the extremes", () => {
    const { container } = draw(<BubbleRow data={REGIONS} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "4 items; largest EMEA at 1,240, smallest LATAM at 210.",
    );
  });

  it("value numerals are ON by default (a low-precision channel owes the number)", () => {
    const { container } = draw(<BubbleRow data={REGIONS} />);
    expect(container.querySelectorAll("circle").length).toBe(4);
    expect([...container.querySelectorAll("text")].map((t) => t.textContent)).toEqual([
      "1,240",
      "890",
      "560",
      "210",
    ]);
  });

  it("label='none' opts out of the numerals", () => {
    const { container } = draw(<BubbleRow data={REGIONS} label="none" />);
    expect(container.querySelector("text")).toBeNull();
  });

  it("label='both' shows label + value", () => {
    const { container } = draw(<BubbleRow data={REGIONS.slice(0, 1)} label="both" />);
    expect(container.querySelector("text")!.textContent).toBe("EMEA 1,240");
  });

  it("summary={false} hides it from assistive tech", () => {
    const { container } = draw(<BubbleRow data={REGIONS} summary={false} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBeNull();
  });

  it("is axe-clean", async () => {
    const { container } = draw(<BubbleRow data={REGIONS} title="Market size" />);
    await expectNoA11yViolations(container);
  });

  describe("degenerate values", () => {
    it("a non-finite value prints no numeral — the presence ring stands alone", () => {
      const { container } = draw(
        <BubbleRow data={[{ label: "EMEA", value: Number.NaN }, ...REGIONS.slice(1)]} />,
      );
      expect([...container.querySelectorAll("text")].map((t) => t.textContent)).toEqual([
        "890",
        "560",
        "210",
      ]);
      // …but it still occupies its slot: 4 bubbles, not 3.
      expect(container.querySelectorAll("circle").length).toBe(4);
    });

    it("no measured value reads as no data", () => {
      const { container } = draw(<BubbleRow data={[{ label: "EMEA", value: null }]} />);
      expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe("No data.");
    });
  });
});

mappedEdgeSuite(
  "BubbleRow",
  (v, i) => ({ label: `R${i}`, value: v }),
  (data) => <BubbleRow data={data} label="both" title="Market size" />,
);
