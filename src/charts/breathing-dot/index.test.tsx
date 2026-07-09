import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { BreathingDot, breathingDotSummary } from "./index.js";
import { expectNoA11yViolations } from "../../test/a11y.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);

describe("<BreathingDot> (plan/24 #19)", () => {
  it("summary states the percent and the band word", () => {
    const { container } = draw(<BreathingDot value={0.42} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe("Load 42% — calm.");
  });

  it("elevated / strained band words", () => {
    expect(breathingDotSummary(0.65)).toBe("Load 65% — elevated.");
    expect(breathingDotSummary(0.9)).toBe("Load 90% — strained.");
  });

  it("unknown value → 'Load unknown.'", () => {
    const { container } = draw(<BreathingDot value={null} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe("Load unknown.");
  });

  it("core carries the band ink; ring present when known", () => {
    const { container } = draw(<BreathingDot value={0.9} />);
    expect(container.querySelector('.mc-breathing-core[data-mc-ink="negative"]')).not.toBeNull();
    expect(container.querySelectorAll("circle").length).toBe(2); // ring + core
  });

  it("unknown → gray core, no ring", () => {
    const { container } = draw(<BreathingDot value={null} />);
    expect(container.querySelector('.mc-breathing-core[data-mc-ink="muted"]')).not.toBeNull();
    expect(container.querySelectorAll("circle").length).toBe(1);
  });

  it('label="value" prints the percent', () => {
    const { container } = draw(<BreathingDot value={0.42} label="value" />);
    expect(container.querySelector('text[data-mc-ink="label"]')!.textContent).toBe("42%");
  });

  it("summary={false} hides it", () => {
    const { container } = draw(<BreathingDot value={0.42} summary={false} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBeNull();
  });

  it("is axe-clean", async () => {
    const { container } = draw(<BreathingDot value={0.42} title="Load" />);
    await expectNoA11yViolations(container);
  });
});
