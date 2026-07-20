import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { BumpStrip } from "./client.js";

const key = (el: HTMLElement, k: string) =>
  el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true }));

describe("interactive <BumpStrip>", () => {
  it("←/→ step periods with rank announcements (first arrow focuses period 1)", async () => {
    const screen = await render(<BumpStrip data={[5, 4, 3, 3]} title="Position" />);
    const wrap = screen.container.querySelector(".mc-bump-live") as HTMLElement;
    wrap.focus();
    key(wrap, "ArrowRight");
    const live = document.querySelector('[aria-live="polite"]')!;
    // Kernel: first Arrow from nothing focuses unit 0 (was the skip-to-1 quirk).
    await expect.poll(() => live.textContent).toBe("Week 1 of 4: #5.");
    key(wrap, "ArrowRight");
    await expect.poll(() => live.textContent).toBe("Week 2 of 4: #4.");
  });

  it("onActive reports the focused datum (period index + rank); null on clear", async () => {
    const seen: unknown[] = [];
    const screen = await render(<BumpStrip data={[5, 4, 3, 3]} onActive={(d) => seen.push(d)} />);
    const wrap = screen.container.querySelector(".mc-bump-live") as HTMLElement;
    wrap.focus();
    key(wrap, "Home");
    await expect.poll(() => seen.at(-1)).toEqual({ index: 0, value: 5 });
    key(wrap, "Escape");
    await expect.poll(() => seen.at(-1)).toBeNull();
  });

  it("Enter selects the active period: fires onSelect + pins a ring that survives blur", async () => {
    const picks: unknown[] = [];
    const screen = await render(<BumpStrip data={[5, 4, 3, 3]} onSelect={(d) => picks.push(d)} />);
    const wrap = screen.container.querySelector(".mc-bump-live") as HTMLElement;
    wrap.focus();
    key(wrap, "Home");
    key(wrap, "Enter");
    await expect.poll(() => picks.at(-1)).toEqual({ index: 0, value: 5 });
    wrap.blur();
    await expect
      .poll(() => screen.container.querySelector('circle[data-mc-w="tick"]'))
      .not.toBeNull();
  });

  it("controlled selectedIndex pins the ring without focus", async () => {
    const screen = await render(<BumpStrip data={[5, 4, 3, 3]} selectedIndex={1} />);
    expect(screen.container.querySelector('circle[data-mc-w="tick"]')).not.toBeNull();
  });
});
