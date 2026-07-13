import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { SegmentedBar } from "./client.js";

const MIX = [
  { label: "Chrome", value: 620 },
  { label: "Safari", value: 240 },
  { label: "Firefox", value: 90 },
  { label: "Edge", value: 30 },
  { label: "Arc", value: 12 },
  { label: "Brave", value: 8 },
];

describe("interactive <SegmentedBar>", () => {
  it("←/→ rove segments; Other announces its member count", async () => {
    const screen = await render(<SegmentedBar data={MIX} title="Share" />);
    const wrap = screen.container.querySelector(".mc-segbar-live") as HTMLElement;
    wrap.focus();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toBe("Safari: 24%, 240.");
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true }));
    await expect.poll(() => live.textContent).toBe("Other: 2%, 2 categories.");
  });
});
