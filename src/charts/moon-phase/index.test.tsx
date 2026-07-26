import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { MoonPhase } from "./index.js";
import { expectNoA11yViolations } from "../../test/a11y.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);
// de-DE separates the number from the percent sign with U+00A0, which is
// indistinguishable from a plain space in source — named, never pasted.
const NBSP = String.fromCharCode(160);

describe("<MoonPhase>", () => {
  it("progress summary is the real string", () => {
    const { container } = draw(<MoonPhase value={0.68} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "68% of the cycle complete.",
    );
  });

  it("cycle summary reads as position through the cycle", () => {
    const { container } = draw(<MoonPhase value={0.68} mode="cycle" />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "68% through the cycle.",
    );
  });

  it("renders base disc, lit region, and outline", () => {
    const { container } = draw(<MoonPhase value={0.6} />);
    expect(container.querySelectorAll('circle[data-mc-ink="band"]').length).toBe(1);
    expect(container.querySelectorAll("path").length).toBe(1); // lit region
    expect(container.querySelectorAll('circle[data-mc-ink="muted"]').length).toBe(1);
  });

  it("new moon (value 0) draws no lit region", () => {
    const { container } = draw(<MoonPhase value={0} />);
    expect(container.querySelector("path")).toBeNull();
  });

  it("value clamps; summary reflects the clamp", () => {
    const { container } = draw(<MoonPhase value={1.4} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "100% of the cycle complete.",
    );
  });

  // The disc paints no numeral, so the summary is where `locale` shows.
  it("locale spells the percent (de-DE puts a NBSP before the sign)", () => {
    const { container } = draw(<MoonPhase value={0.68} locale="de-DE" />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      `68${NBSP}% of the cycle complete.`,
    );
  });

  it("summary={false} hides it from assistive tech", () => {
    const { container } = draw(<MoonPhase value={0.5} summary={false} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBeNull();
  });

  it("is axe-clean", async () => {
    const { container } = draw(<MoonPhase value={0.68} title="Sprint" />);
    await expectNoA11yViolations(container);
  });
});
