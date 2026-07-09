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
});
