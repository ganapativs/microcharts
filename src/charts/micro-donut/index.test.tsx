import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { MicroDonut } from "./index.js";
import { expectNoA11yViolations } from "../../test/a11y.js";
import { seriesEdgeSuite } from "../../test/edge-cases.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);

// de-DE separates the number from the percent sign with U+00A0, which is
// indistinguishable from a plain space in source — named, never pasted.
const NBSP = String.fromCharCode(160);

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

  it("a hostile size paints the default ring — never NaN coords under a full name", () => {
    for (const size of [Number.NaN, Infinity, 0, -10]) {
      const { container } = draw(<MicroDonut data={MIX} size={size} />);
      const svg = container.querySelector("svg")!;
      expect(svg.getAttribute("viewBox")).toBe("0 0 24 24");
      // The seat rides on the same numbers; `--mc-seat: NaN` was the tell.
      expect(svg.getAttribute("style")).not.toContain("NaN");
      for (const w of container.querySelectorAll("path.mc-donut-wedge")) {
        expect(w.getAttribute("d")).toMatch(/^M[\d.]/);
        // A negative stroke-width is an SVG error: the browser drops the wedge.
        expect(Number((w as SVGElement).style.strokeWidth)).toBeGreaterThan(0);
      }
    }
  });

  it("maxWedges is a ceiling — a hostile value never lets more wedges through", () => {
    for (const maxWedges of [Number.NaN, Infinity, 0, -3]) {
      const { container } = draw(<MicroDonut data={MIX} maxWedges={maxWedges} />);
      expect(container.querySelectorAll("path.mc-donut-wedge").length).toBe(4);
    }
    expect(
      draw(<MicroDonut data={MIX} maxWedges={2} />).container.querySelectorAll(
        "path.mc-donut-wedge",
      ).length,
    ).toBe(2);
  });

  it("locale reaches the summary percents (the static entry used to hardcode en-US)", () => {
    const { container } = draw(<MicroDonut data={MIX} locale="de-DE" />);
    // de-DE writes a NBSP before the sign; the interactive entry already did.
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      `Chrome 62${NBSP}%, Safari 24${NBSP}%, Firefox 9${NBSP}%, Other 5${NBSP}%.`,
    );
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
