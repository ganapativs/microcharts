import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { MicroDonut } from "./client.js";

const MIX = [
  { label: "Chrome", value: 620 },
  { label: "Safari", value: 240 },
  { label: "Firefox", value: 140 },
];

describe("interactive <MicroDonut> (plan/22 #18)", () => {
  it("←/→ rove wedges with share announcements", async () => {
    const screen = await render(<MicroDonut data={MIX} title="Mix" />);
    const wrap = screen.container.querySelector(".mc-donut-live") as HTMLElement;
    wrap.focus();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toBe("Safari: 24%, 240.");
  });

  it("decorative → no tab stop, no live region", async () => {
    const screen = await render(<MicroDonut data={MIX} decorative />);
    expect(screen.container.querySelector('[tabindex="0"]')).toBeNull();
    expect(document.querySelector('[aria-live="polite"]')).toBeNull();
  });
});
