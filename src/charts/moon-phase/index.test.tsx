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

  // A hostile `size` used to render a NaN disc and a NaN `--mc-seat` under a
  // perfectly normal accessible name (see resolveSize).
  it("a non-finite size falls back to the default box, not NaN coords", () => {
    const { container } = draw(<MoonPhase value={0.68} size={NaN} />);
    const svg = container.querySelector("svg")!;
    expect(svg.getAttribute("viewBox")).toBe("0 0 16 16");
    expect(svg.outerHTML).not.toMatch(/NaN|Infinity/);
  });

  it("a sub-unit size keeps every mark inside the viewBox", () => {
    const { container } = draw(<MoonPhase value={0.68} size={-20} />);
    const svg = container.querySelector("svg")!;
    expect(svg.getAttribute("viewBox")).toBe("0 0 1 1");
    for (const c of container.querySelectorAll("circle")) {
      const [cx, r] = [Number(c.getAttribute("cx")), Number(c.getAttribute("r"))];
      expect(r).toBeGreaterThanOrEqual(0);
      expect(cx - r).toBeGreaterThanOrEqual(0);
      expect(cx + r).toBeLessThanOrEqual(1);
    }
  });

  // The interactive bloom targets this attribute, so it must mark the lit path
  // and nothing a caller puts in `children`.
  it("data-mc-moon marks the lit path only", () => {
    const { container } = draw(
      <MoonPhase value={0}>
        <path d="M0 0L1 1" />
      </MoonPhase>,
    );
    expect(container.querySelectorAll("[data-mc-moon]").length).toBe(0);
    const lit = draw(<MoonPhase value={0.6} />).container.querySelectorAll("[data-mc-moon]");
    expect(lit.length).toBe(1);
    expect(lit[0]!.tagName.toLowerCase()).toBe("path");
  });

  it("is axe-clean", async () => {
    const { container } = draw(<MoonPhase value={0.68} title="Sprint" />);
    await expectNoA11yViolations(container);
  });
});
