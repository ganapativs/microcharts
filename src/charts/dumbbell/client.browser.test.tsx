import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { Dumbbell } from "./client.js";

const DATA = [
  { label: "Paris", from: 50, to: 55 },
  { label: "Berlin", from: 48, to: 68 },
];

const key = (el: HTMLElement, k: string) =>
  el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true }));

describe("interactive <Dumbbell>", () => {
  it("↑/↓ rove rows, announcing each pair's change", async () => {
    const screen = await render(<Dumbbell data={DATA} title="Bands" />);
    const wrap = screen.container.querySelector(".mc-dumbbell-live") as HTMLElement;
    wrap.focus();
    // First arrow focuses row 0 (no skip-to-1).
    key(wrap, "ArrowDown");
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toBe("From 50 to 55, up 10%.");
    key(wrap, "ArrowDown");
    await expect.poll(() => live.textContent).toBe("From 48 to 68, up 42%.");
  });

  it("a pair with a non-finite endpoint announces no data without throwing", async () => {
    const gappy = [
      { label: "Paris", from: 50, to: 55 },
      { label: "Berlin", from: 48, to: Number.NaN },
    ];
    const screen = await render(<Dumbbell data={gappy} title="Bands" />);
    const wrap = screen.container.querySelector(".mc-dumbbell-live") as HTMLElement;
    wrap.focus();
    key(wrap, "ArrowDown");
    key(wrap, "ArrowDown"); // Berlin: NaN endpoint
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toBe("No data.");
  });

  it("onActive reports the focused datum (row index + `to` value); null on clear", async () => {
    const seen: unknown[] = [];
    const screen = await render(<Dumbbell data={DATA} onActive={(d) => seen.push(d)} />);
    const wrap = screen.container.querySelector(".mc-dumbbell-live") as HTMLElement;
    wrap.focus();
    key(wrap, "ArrowDown");
    await expect.poll(() => seen.at(-1)).toEqual({ index: 0, value: 55, label: "Paris" });
    key(wrap, "Escape");
    await expect.poll(() => seen.at(-1)).toBeNull();
  });

  it("Enter selects the active row: fires onSelect + pins a persistent mark", async () => {
    const picks: unknown[] = [];
    const screen = await render(<Dumbbell data={DATA} onSelect={(d) => picks.push(d)} />);
    const wrap = screen.container.querySelector(".mc-dumbbell-live") as HTMLElement;
    wrap.focus();
    key(wrap, "ArrowDown");
    key(wrap, "Enter");
    expect(picks.at(-1)).toEqual({ index: 0, value: 55, label: "Paris" });
    // Pin survives blur (it is selection, not hover).
    wrap.blur();
    await expect.poll(() => wrap.querySelector('circle[data-mc-w="tick"]')).not.toBeNull();
  });

  it("controlled selectedIndex pins the mark without focus", async () => {
    const screen = await render(<Dumbbell data={DATA} selectedIndex={1} />);
    const wrap = screen.container.querySelector(".mc-dumbbell-live") as HTMLElement;
    expect(wrap.querySelector('circle[data-mc-w="tick"]')).not.toBeNull();
  });
});
