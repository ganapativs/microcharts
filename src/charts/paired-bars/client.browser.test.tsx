import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { PairedBars } from "./client.js";

const DATA = [
  { label: "East", value: 940, ref: 1200 },
  { label: "West", value: 410, ref: 400 },
];

const key = (el: HTMLElement, k: string) =>
  el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true }));

describe("interactive <PairedBars>", () => {
  it("arrow keys rove pairs with vs announcements", async () => {
    const screen = await render(<PairedBars data={DATA} title="Budget" />);
    const wrap = screen.container.querySelector(".mc-paired-live") as HTMLElement;
    wrap.focus();
    // First arrow focuses pair 0 (no skip-to-1).
    key(wrap, "ArrowRight");
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toBe("East: 940 vs 1,200.");
    key(wrap, "ArrowRight");
    await expect.poll(() => live.textContent).toBe("West: 410 vs 400.");
    key(wrap, "Home");
    await expect.poll(() => live.textContent).toBe("East: 940 vs 1,200.");
  });

  it("onActive reports the focused datum (pair index + value); null on clear", async () => {
    const seen: unknown[] = [];
    const screen = await render(<PairedBars data={DATA} onActive={(d) => seen.push(d)} />);
    const wrap = screen.container.querySelector(".mc-paired-live") as HTMLElement;
    wrap.focus();
    key(wrap, "ArrowRight");
    await expect.poll(() => seen.at(-1)).toEqual({ index: 0, value: 940, label: "East" });
    key(wrap, "Escape");
    await expect.poll(() => seen.at(-1)).toBeNull();
  });

  it("Enter selects the active pair: fires onSelect + pins a persistent outline", async () => {
    const picks: unknown[] = [];
    const screen = await render(<PairedBars data={DATA} onSelect={(d) => picks.push(d)} />);
    const wrap = screen.container.querySelector(".mc-paired-live") as HTMLElement;
    wrap.focus();
    key(wrap, "ArrowRight");
    key(wrap, "Enter");
    expect(picks.at(-1)).toEqual({ index: 0, value: 940, label: "East" });
    // Pin survives blur (it is selection, not hover).
    wrap.blur();
    await expect.poll(() => wrap.querySelector('rect[data-mc-w="tick"]')).not.toBeNull();
  });

  it("controlled selectedIndex pins the outline without focus", async () => {
    const screen = await render(<PairedBars data={DATA} selectedIndex={1} />);
    const wrap = screen.container.querySelector(".mc-paired-live") as HTMLElement;
    expect(wrap.querySelector('rect[data-mc-w="tick"]')).not.toBeNull();
  });
});
