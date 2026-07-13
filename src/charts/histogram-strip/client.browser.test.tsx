import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { HistogramStrip } from "./client.js";

const VALUES = [1, 1, 1, 5, 5, 9];

describe("interactive <HistogramStrip>", () => {
  it("←/→ rove bins with range announcements", async () => {
    const screen = await render(<HistogramStrip data={VALUES} bins={3} title="Dist" />);
    const wrap = screen.container.querySelector(".mc-histogram-live") as HTMLElement;
    wrap.focus();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toMatch(/^\d+(\.\d+)? to \d+(\.\d+)?: 2 values\.$/);
  });
});
