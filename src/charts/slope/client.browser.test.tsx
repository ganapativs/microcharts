import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { Slope } from "./client.js";

const DATA = [
  { label: "East", from: 48, to: 61 },
  { label: "West", from: 55, to: 41 },
];

const key = (el: HTMLElement, k: string) =>
  el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true }));

describe("interactive <Slope>", () => {
  it("↑/↓ rove categories ordered by `to`, announcing slopes", async () => {
    const screen = await render(<Slope data={DATA} title="Ranks" />);
    const wrap = screen.container.querySelector(".mc-slope-live") as HTMLElement;
    wrap.focus();
    key(wrap, "ArrowDown");
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toBe("East: 48 to 61, up 27%.");
    key(wrap, "ArrowDown");
    await expect.poll(() => live.textContent).toBe("West: 55 to 41, down 25%.");
  });

  it("onActive reports the focused datum (row index + `to` value); null on clear", async () => {
    const seen: unknown[] = [];
    const screen = await render(<Slope data={DATA} onActive={(d) => seen.push(d)} />);
    const wrap = screen.container.querySelector(".mc-slope-live") as HTMLElement;
    wrap.focus();
    key(wrap, "ArrowDown");
    await expect.poll(() => seen.at(-1)).toEqual({ index: 0, value: 61, label: "East" });
    key(wrap, "Escape");
    await expect.poll(() => seen.at(-1)).toBeNull();
  });

  it("Enter selects the active line: fires onSelect + pins a persistent mark", async () => {
    const picks: unknown[] = [];
    const screen = await render(<Slope data={DATA} onSelect={(d) => picks.push(d)} />);
    const wrap = screen.container.querySelector(".mc-slope-live") as HTMLElement;
    wrap.focus();
    key(wrap, "ArrowDown");
    key(wrap, "Enter");
    expect(picks.at(-1)).toEqual({ index: 0, value: 61, label: "East" });
    // Pin survives blur (it is selection, not hover).
    wrap.blur();
    await expect.poll(() => wrap.querySelector('line[data-mc-w="tick"]')).not.toBeNull();
  });

  it("controlled selectedIndex pins the mark without focus", async () => {
    const screen = await render(<Slope data={DATA} selectedIndex={1} />);
    const wrap = screen.container.querySelector(".mc-slope-live") as HTMLElement;
    expect(wrap.querySelector('line[data-mc-w="tick"]')).not.toBeNull();
  });
});
