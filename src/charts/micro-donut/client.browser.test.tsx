import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { MicroDonut } from "./client.js";

const MIX = [
  { label: "Chrome", value: 620 },
  { label: "Safari", value: 240 },
  { label: "Firefox", value: 140 },
];

const key = (el: HTMLElement, k: string) =>
  el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true }));

describe("interactive <MicroDonut>", () => {
  it("←/→ rove wedges from the first with share announcements", async () => {
    const screen = await render(<MicroDonut data={MIX} title="Mix" />);
    const wrap = screen.container.querySelector(".mc-donut-live") as HTMLElement;
    wrap.focus();
    const live = document.querySelector('[aria-live="polite"]')!;
    // First arrow lands on unit 0 (the kernel's roving default), not unit 1.
    key(wrap, "ArrowRight");
    await expect.poll(() => live.textContent).toBe("Chrome: 62%, 620.");
    key(wrap, "ArrowRight");
    await expect.poll(() => live.textContent).toBe("Safari: 24%, 240.");
  });

  it("decorative → no tab stop, no live region", async () => {
    const screen = await render(<MicroDonut data={MIX} decorative />);
    expect(screen.container.querySelector('[tabindex="0"]')).toBeNull();
    expect(document.querySelector('[aria-live="polite"]')).toBeNull();
  });

  it("onActive reports the focused datum (wedge index + value); null on Escape", async () => {
    const seen: unknown[] = [];
    const screen = await render(<MicroDonut data={MIX} onActive={(d) => seen.push(d)} />);
    const wrap = screen.container.querySelector(".mc-donut-live") as HTMLElement;
    wrap.focus();
    key(wrap, "ArrowRight");
    await expect.poll(() => seen.at(-1)).toEqual({ index: 0, value: 620, label: "Chrome" });
    key(wrap, "Escape");
    await expect.poll(() => seen.at(-1)).toBeNull();
  });

  it("Enter selects the active wedge: fires onSelect + pins a mark that survives blur", async () => {
    const picks: unknown[] = [];
    const screen = await render(<MicroDonut data={MIX} onSelect={(d) => picks.push(d)} />);
    const wrap = screen.container.querySelector(".mc-donut-live") as HTMLElement;
    wrap.focus();
    key(wrap, "ArrowRight");
    key(wrap, "Enter");
    expect(picks.at(-1)).toEqual({ index: 0, value: 620, label: "Chrome" });
    wrap.blur();
    await expect
      .poll(() => screen.container.querySelector('path[data-mc-w="tick"]'))
      .not.toBeNull();
  });

  it("controlled selectedIndex pins the wedge without focus", async () => {
    const screen = await render(<MicroDonut data={MIX} selectedIndex={1} />);
    expect(screen.container.querySelector('path[data-mc-w="tick"]')).not.toBeNull();
  });
});
