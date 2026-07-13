import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { ChangePoint } from "./index.js";
import { expectNoA11yViolations } from "../../test/a11y.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);
// 34 points at 32, then 20 at 48 → a clean +50% step at index 34
const STEP = [...Array(34).fill(32), ...Array(20).fill(48)];

describe("<ChangePoint>", () => {
  it("summary names the shift, break, means, and tail — the real string", () => {
    const { container } = draw(<ChangePoint data={STEP} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "Level shifted up 50% around point 34 (mean 32 → 48); stable since.",
    );
  });

  it("no detected shift → 'No clear level shift across N points.'", () => {
    const flat = Array.from({ length: 90 }, (_, i) => 40 + ((i * 3) % 4) - 1);
    const { container } = draw(<ChangePoint data={flat} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "No clear level shift across 90 points.",
    );
  });

  it("renders regime shading, mean hairlines, the line, and a break marker", () => {
    const { container } = draw(<ChangePoint data={STEP} width={120} />);
    // only the odd (2nd) regime is tinted → 1 shading rect for a 2-regime chart
    expect(container.querySelectorAll('rect[data-mc-ink="region"]').length).toBe(1);
    expect(container.querySelectorAll('line[data-mc-ink="ghost"]').length).toBe(2); // mean hairlines
    expect(container.querySelector('path[data-mc-ink="data"]')).not.toBeNull(); // series line
    expect(container.querySelectorAll('[data-mc-ink="flag"]').length).toBe(2); // hairline + triangle
  });

  it("means={false} drops the hairlines", () => {
    const { container } = draw(<ChangePoint data={STEP} means={false} />);
    expect(container.querySelectorAll('line[data-mc-ink="ghost"]').length).toBe(0);
  });

  it("explicit breaks override detection (pure annotation)", () => {
    const flat = Array(40).fill(7);
    const { container } = draw(<ChangePoint data={flat} breaks={[20]} />);
    expect(container.querySelectorAll('rect[data-mc-ink="region"]').length).toBe(1);
  });

  it("label='delta' prints the signed % across the last break", () => {
    const { container } = draw(<ChangePoint data={STEP} label="delta" width={120} />);
    expect(container.querySelector("text")!.textContent).toBe("+50%");
  });

  it("is axe-clean", async () => {
    const { container } = draw(<ChangePoint data={STEP} title="Error rate" />);
    await expectNoA11yViolations(container);
  });
});
