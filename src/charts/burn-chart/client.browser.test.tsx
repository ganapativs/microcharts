import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { BurnChart } from "./client.js";

const PLAN = [40, 36, 32, 28, 24, 20, 16, 12, 8, 4, 0];
const ACTUAL = [40, 38, 36, 34, 32, 30];

describe("interactive <BurnChart> (plan/23 #8)", () => {
  it("arrow keys step days; announces actual vs plan, then the projection region", async () => {
    const screen = await render(<BurnChart data={{ plan: PLAN, actual: ACTUAL }} title="Sprint" />);
    const wrap = screen.container.querySelector(".mc-burn-chart-live") as HTMLElement;
    wrap.focus();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true }));
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toBe("day 0: 40 points remain, plan 40.");
    // step to a projected day (past today = index 5)
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true }));
    await expect.poll(() => live.textContent).toContain("(projected)");
  });

  it("a history day announces actual and plan together", async () => {
    const screen = await render(<BurnChart data={{ plan: PLAN, actual: ACTUAL }} title="Sprint" />);
    const wrap = screen.container.querySelector(".mc-burn-chart-live") as HTMLElement;
    wrap.focus();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true }));
    for (let i = 0; i < 5; i++)
      wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toBe("day 5: 30 points remain, plan 20.");
    // a VISIBLE readout chip appears at the focused point (not just the a11y region)
    await expect.poll(() => wrap.querySelector(".mc-spark-readout")?.textContent).toBe("30");
  });
});
