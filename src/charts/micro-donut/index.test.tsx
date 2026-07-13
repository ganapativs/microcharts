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
    expect(container.querySelectorAll("path").length).toBe(4);
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
