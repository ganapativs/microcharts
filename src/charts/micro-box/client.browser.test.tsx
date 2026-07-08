import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { MicroBox } from "./client.js";

describe("interactive <MicroBox> (plan/22 #16)", () => {
  it("←/→ rove the fixed 5-stop model with stat announcements", async () => {
    const screen = await render(
      <MicroBox stats={{ min: 12, q1: 35, median: 42, q3: 51, max: 96 }} title="Latency" />,
    );
    const wrap = screen.container.querySelector(".mc-box-live") as HTMLElement;
    wrap.focus();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toBe("Min: 12.");
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    await expect.poll(() => live.textContent).toBe("Q1: 35.");
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true }));
    await expect.poll(() => live.textContent).toBe("Max: 96.");
  });
});
