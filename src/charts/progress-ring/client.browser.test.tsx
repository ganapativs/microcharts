import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { ProgressRing } from "./client.js";

const key = (el: HTMLElement, k: string) =>
  el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true }));

describe("interactive <ProgressRing>", () => {
  it("announces only at quarter-threshold crossings", async () => {
    const screen = await render(<ProgressRing value={0.2} />);
    const live = document.querySelector('[aria-live="polite"]')!;
    await screen.rerender(<ProgressRing value={0.23} />); // no crossing
    expect(live.textContent).toBe("");
    await screen.rerender(<ProgressRing value={0.55} />); // crossed 25 + 50
    await expect.poll(() => live.textContent).toBe("55% complete.");
  });

  it("sweep announces remaining", async () => {
    const screen = await render(<ProgressRing value={0.2} sweep />);
    await screen.rerender(<ProgressRing value={0.8} sweep />);
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toBe("20% remaining.");
  });

  it("click fires onSelect with the fraction", async () => {
    const picks: unknown[] = [];
    const screen = await render(<ProgressRing value={0.55} onSelect={(d) => picks.push(d)} />);
    const wrap = screen.container.querySelector(".mc-ring-live") as HTMLElement;
    wrap.click();
    expect(picks).toEqual([{ index: 0, value: 0.55 }]);
  });

  it("Enter fires onSelect from the focused wrapper", async () => {
    const picks: unknown[] = [];
    const screen = await render(<ProgressRing value={2} max={8} onSelect={(d) => picks.push(d)} />);
    const wrap = screen.container.querySelector(".mc-ring-live") as HTMLElement;
    wrap.focus();
    key(wrap, "Enter");
    expect(picks).toEqual([{ index: 0, value: 0.25 }]);
  });
});
