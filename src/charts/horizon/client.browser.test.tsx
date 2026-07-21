import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { Horizon } from "./client.js";

const D = [5, -12, 96, 40];

describe("interactive <Horizon>", () => {
  it("announces the TRUE value, not the band", async () => {
    const screen = await render(<Horizon data={D} title="Load" />);
    const wrap = screen.container.querySelector(".mc-horizon-live") as HTMLElement;
    wrap.focus();
    // First arrow from nothing lands on sample 0 (the kernel contract).
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toBe("Point 1 of 4: 5.");
    // …and the next sample reads its true value, not the folded band.
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    await expect.poll(() => live.textContent).toBe("Point 2 of 4: -12.");
  });

  it("onActive reports the focused datum (index + value); null on clear", async () => {
    const seen: unknown[] = [];
    const screen = await render(<Horizon data={D} onActive={(d) => seen.push(d)} />);
    const wrap = screen.container.querySelector(".mc-horizon-live") as HTMLElement;
    wrap.focus();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    await expect.poll(() => seen.at(-1)).toMatchObject({ index: 1, value: -12 });
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await expect.poll(() => seen.at(-1)).toBeNull();
  });

  it("Enter selects the active sample: fires onSelect + pins a mark that survives blur", async () => {
    const picks: unknown[] = [];
    const screen = await render(<Horizon data={D} onSelect={(d) => picks.push(d)} />);
    const wrap = screen.container.querySelector(".mc-horizon-live") as HTMLElement;
    wrap.focus();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    await expect.poll(() => picks.at(-1)).toMatchObject({ index: 1, value: -12 });
    wrap.blur();
    await expect.poll(() => wrap.querySelector('circle[data-mc-w="tick"]')).not.toBeNull();
  });

  it("controlled selectedIndex pins the mark with no interaction", async () => {
    const screen = await render(<Horizon data={D} selectedIndex={2} />);
    const wrap = screen.container.querySelector(".mc-horizon-live") as HTMLElement;
    expect(wrap.querySelector('circle[data-mc-w="tick"]')).not.toBeNull();
  });
});
