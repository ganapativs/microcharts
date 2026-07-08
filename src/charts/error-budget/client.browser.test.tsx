import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { ErrorBudget } from "./client.js";

const OBSERVED = [1, 0.96, 0.93, 0.9, 0.86, 0.83, 0.79, 0.75, 0.71, 0.67, 0.64, 0.62];

describe("interactive <ErrorBudget> (plan/23 #9)", () => {
  it("arrow keys step; the live region states remaining + burn rate", async () => {
    const screen = await render(<ErrorBudget data={OBSERVED} window={30} unit="day" title="SLO" />);
    const wrap = screen.container.querySelector(".mc-error-budget-live") as HTMLElement;
    wrap.focus();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true }));
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect
      .poll(() => live.textContent)
      .toBe("day 1 of 30: 100% budget remaining, burning at 0× steady rate.");
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true }));
    await expect
      .poll(() => live.textContent)
      .toBe("day 12 of 30: 62% budget remaining, burning at 0.6× steady rate.");
    // a VISIBLE readout chip shows remaining · rate
    await expect
      .poll(() => wrap.querySelector(".mc-spark-readout")?.textContent)
      .toBe("62% · 0.6×");
  });

  it("rapid arrow presses don't drop (functional updater)", async () => {
    const screen = await render(<ErrorBudget data={OBSERVED} window={30} title="SLO" />);
    const wrap = screen.container.querySelector(".mc-error-budget-live") as HTMLElement;
    wrap.focus();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true }));
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toContain("day 3 of 30");
  });
});
