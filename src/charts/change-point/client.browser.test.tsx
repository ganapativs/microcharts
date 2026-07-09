import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { ChangePoint } from "./client.js";

const STEP = [...Array(34).fill(32), ...Array(20).fill(48)];

describe("interactive <ChangePoint> (plan/23 #19)", () => {
  it("←/→ step points, announcing value + regime; a readout chip shows the value", async () => {
    const screen = await render(
      <ChangePoint data={STEP} width={200} height={32} title="Error rate" />,
    );
    const wrap = screen.container.querySelector(".mc-change-point-live") as HTMLElement;
    wrap.focus();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true }));
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toMatch(/^Point 0: 32 — regime 1 of 2, mean 32\.$/);
    await expect.poll(() => wrap.querySelector(".mc-spark-readout")?.textContent).toBe("32");
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true }));
    await expect.poll(() => live.textContent).toMatch(/regime 2 of 2, mean 48\.$/);
  });

  it("Tab cycles the breaks as first-class stops", async () => {
    const screen = await render(
      <ChangePoint data={STEP} width={200} height={32} title="Error rate" />,
    );
    const wrap = screen.container.querySelector(".mc-change-point-live") as HTMLElement;
    wrap.focus();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true }));
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true }));
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toBe("Break at point 34: mean 32 to 48 (+50%).");
  });
});
