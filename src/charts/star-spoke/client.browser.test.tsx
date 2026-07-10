import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { StarSpoke } from "./client.js";

const PROFILE = [
  { label: "Speed", value: 0.9 },
  { label: "Power", value: 0.6 },
  { label: "Cost", value: 0.3 },
];

describe("interactive <StarSpoke> (plan/25 §9)", () => {
  it("→ rotates focus through spokes; announces label + value", async () => {
    const screen = await render(<StarSpoke data={PROFILE} title="Profile" size={64} />);
    const wrap = screen.container.querySelector(".mc-star-live") as HTMLElement;
    wrap.focus();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toBe("Power: 0.6.");
  });

  // Regression: the wrapper is an inline-block sized by the `size` prop (no CSS
  // width class), so the composed SVG must hug it at its natural size — a
  // stray `style={{width:"100%"}}` on the static entry collapses both to 0×0
  // in this exact layout (see memory: interactive-wrapper-fills-svg "Nuance").
  it("composed SVG fills the size-prop wrapper exactly (no 0×0 collapse)", async () => {
    const screen = await render(<StarSpoke data={PROFILE} title="Profile" size={64} />);
    const wrap = screen.container.querySelector(".mc-star-live") as HTMLElement;
    const svg = wrap.querySelector("svg")!;
    const wrapRect = wrap.getBoundingClientRect();
    const svgRect = svg.getBoundingClientRect();
    expect(svgRect.width).toBeGreaterThan(0);
    expect(svgRect.width).toBe(wrapRect.width);
    expect(svgRect.height).toBe(wrapRect.height);
  });
});
