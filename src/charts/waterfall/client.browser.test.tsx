import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { Waterfall } from "./client.js";

const PL = [
  { label: "Product", value: 300 },
  { label: "Refunds", value: -140 },
];

describe("interactive <Waterfall> (plan/22 #20)", () => {
  it("←/→ rove steps with running levels; End focuses the total", async () => {
    const screen = await render(<Waterfall data={PL} start={1200} title="P&L" />);
    const wrap = screen.container.querySelector(".mc-waterfall-live") as HTMLElement;
    wrap.focus();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toBe("Refunds: −140, running 1,360.");
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true }));
    await expect.poll(() => live.textContent).toBe("Total: 1,360.");
  });
});
