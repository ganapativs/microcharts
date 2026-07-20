import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { DepthWedge } from "./client.js";

const BOOK = {
  demand: [
    { level: 99.5, amount: 400 },
    { level: 99, amount: 200 },
  ],
  supply: [
    { level: 100.5, amount: 300 },
    { level: 101, amount: 150 },
  ],
};

const key = (el: HTMLElement, k: string) =>
  el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true }));

describe("interactive <DepthWedge>", () => {
  it("→ walks levels; announces the cumulative depth on a side", async () => {
    const screen = await render(<DepthWedge data={BOOK} title="Book" width={160} height={24} />);
    const wrap = screen.container.querySelector(".mc-depth-live") as HTMLElement;
    wrap.focus();
    key(wrap, "ArrowRight");
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toMatch(/(demand|supply): .+ within .+ of mid\./);
  });

  it("onActive reports the focused depth step; null on Escape", async () => {
    const seen: unknown[] = [];
    const screen = await render(
      <DepthWedge data={BOOK} width={160} height={24} onActive={(d) => seen.push(d)} />,
    );
    const wrap = screen.container.querySelector(".mc-depth-live") as HTMLElement;
    wrap.focus();
    // steps merge both sides sorted by x: the leftmost is the deepest bid (99, cum 600)
    key(wrap, "ArrowRight");
    expect(seen.at(-1)).toEqual({ index: 0, value: 600 });
    key(wrap, "Escape");
    expect(seen.at(-1)).toBeNull();
  });

  it("Enter selects the active step: fires onSelect + pins a probe", async () => {
    const picks: unknown[] = [];
    const screen = await render(
      <DepthWedge data={BOOK} width={160} height={24} onSelect={(d) => picks.push(d)} />,
    );
    const wrap = screen.container.querySelector(".mc-depth-live") as HTMLElement;
    wrap.focus();
    key(wrap, "ArrowRight");
    key(wrap, "Enter");
    expect(picks.at(-1)).toEqual({ index: 0, value: 600 });
    // Pin survives blur (it is selection, not hover).
    wrap.blur();
    await expect
      .poll(() => screen.container.querySelector('line[data-mc-w="tick"]'))
      .not.toBeNull();
  });

  it("controlled selectedIndex pins the probe without focus", async () => {
    const screen = await render(
      <DepthWedge data={BOOK} width={160} height={24} selectedIndex={1} />,
    );
    expect(screen.container.querySelector('line[data-mc-w="tick"]')).not.toBeNull();
  });
});
