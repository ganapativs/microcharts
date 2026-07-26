import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
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
    expect(picks).toMatchObject([{ index: 0, value: 0.55 }]);
  });

  it("Enter fires onSelect from the focused wrapper", async () => {
    const picks: unknown[] = [];
    const screen = await render(<ProgressRing value={2} max={8} onSelect={(d) => picks.push(d)} />);
    const wrap = screen.container.querySelector(".mc-ring-live") as HTMLElement;
    wrap.focus();
    key(wrap, "Enter");
    expect(picks).toMatchObject([{ index: 0, value: 0.25 }]);
  });

  it("hover/focus reveals the percent an arc alone can only approximate", async () => {
    const screen = await render(<ProgressRing value={0.62} title="Upload" />);
    const wrap = screen.container.querySelector(".mc-ring-live") as HTMLElement;
    const chip = () => screen.container.querySelector(".mc-spark-readout")?.textContent;
    await userEvent.hover(wrap);
    await expect.poll(chip).toBe("62%");
    await userEvent.unhover(wrap);
    wrap.focus();
    await expect.poll(chip).toBe("62%");
  });

  it("sweep mode reads out what is LEFT, matching its own summary", async () => {
    const screen = await render(<ProgressRing value={0.62} sweep title="Budget" />);
    const wrap = screen.container.querySelector(".mc-ring-live") as HTMLElement;
    expect(wrap.getAttribute("aria-label")).toBe("Budget. 38% remaining.");
    await userEvent.hover(wrap);
    await expect
      .poll(() => screen.container.querySelector(".mc-spark-readout")?.textContent)
      .toBe("38%");
  });

  it('label="percent" prints the number, so the chip stays away', async () => {
    const screen = await render(<ProgressRing value={0.62} label="percent" size={48} />);
    const wrap = screen.container.querySelector(".mc-ring-live") as HTMLElement;
    await userEvent.hover(wrap);
    expect(screen.container.querySelector(".mc-spark-readout")).toBeNull();
  });
});
