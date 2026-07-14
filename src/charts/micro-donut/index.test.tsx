import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { MicroDonut } from "./index.js";
import { expectNoA11yViolations } from "../../test/a11y.js";
import { seriesEdgeSuite } from "../../test/edge-cases.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);

const MIX = [
  { label: "Chrome", value: 620 },
  { label: "Safari", value: 240 },
  { label: "Firefox", value: 90 },
  { label: "Edge", value: 30 },
  { label: "Arc", value: 20 },
];

describe("<MicroDonut>", () => {
  it("≤ 4 wedges + Other rollup; summary reuses the shares wording", () => {
    const { container } = draw(<MicroDonut data={MIX} />);
    const wedges = container.querySelectorAll("path.mc-donut-wedge");
    expect(wedges.length).toBe(4);
    // Stroked band, not a filled sector: fill none + an inline stroke token.
    for (const w of wedges) {
      expect(w.getAttribute("fill")).toBe("none");
      expect((w as SVGElement).style.stroke).toContain("var(--mc-");
      expect((w as SVGElement).style.strokeWidth).not.toBe("");
    }
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "Chrome 62%, Safari 24%, Firefox 9%, Other 5%.",
    );
  });

  it("decorative → aria-hidden, no naming (the sanctioned ornament framing)", () => {
    const { container } = draw(<MicroDonut data={MIX} decorative title="ignored" />);
    expect(container.querySelector("svg")!.getAttribute("aria-hidden")).toBe("true");
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBeNull();
  });

  it("single category renders a full annulus (summary disambiguates from a ring)", () => {
    const { container } = draw(<MicroDonut data={[{ label: "All", value: 5 }]} />);
    expect(container.querySelectorAll("path").length).toBe(1);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe("All 100%.");
  });

  it("is axe-clean", async () => {
    const { container } = draw(<MicroDonut data={MIX.slice(0, 3)} title="Browser mix" />);
    await expectNoA11yViolations(container);
  });
});

seriesEdgeSuite("MicroDonut", (data) => (
  <MicroDonut data={data.map((v, i) => ({ label: `c${i}`, value: v }))} title="Edge" />
));

describe("<MicroDonut> colors", () => {
  it("colors[] overrides wedge strokes, cycling; Other stays neutral", () => {
    const { container } = draw(<MicroDonut data={MIX} colors={["rgb(1, 2, 3)", "rgb(4, 5, 6)"]} />);
    const wedges = [...container.querySelectorAll("path.mc-donut-wedge")] as SVGElement[];
    expect(wedges[0]!.style.stroke).toBe("rgb(1, 2, 3)");
    expect(wedges[1]!.style.stroke).toBe("rgb(4, 5, 6)");
    expect(wedges[wedges.length - 1]!.style.stroke).toBe("var(--mc-neutral)");
  });
});
