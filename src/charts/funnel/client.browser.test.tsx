import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { Funnel } from "./client.js";

const PIPE = [
  { label: "Visitors", value: 12400 },
  { label: "Signups", value: 5704 },
  { label: "Checkout", value: 2730 },
];

const key = (el: HTMLElement, k: string) =>
  el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true }));

describe("interactive <Funnel>", () => {
  it("←/→ rove stages with retained-share announcements", async () => {
    const screen = await render(<Funnel data={PIPE} title="Pipeline" />);
    const wrap = screen.container.querySelector(".mc-funnel-live") as HTMLElement;
    wrap.focus();
    key(wrap, "End");
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toBe("Checkout: 2,730 — 22% of Visitors.");
  });

  it("onActive reports the focused stage; null once cleared", async () => {
    const seen: unknown[] = [];
    const screen = await render(<Funnel data={PIPE} onActive={(d) => seen.push(d)} />);
    const wrap = screen.container.querySelector(".mc-funnel-live") as HTMLElement;
    wrap.focus();
    // First arrow lands on unit 0 (the kernel's shared convention).
    key(wrap, "ArrowRight");
    expect(seen.at(-1)).toEqual({ index: 0, value: 12400, label: "Visitors" });
    key(wrap, "ArrowRight");
    expect(seen.at(-1)).toEqual({ index: 1, value: 5704, label: "Signups" });
    key(wrap, "Escape");
    expect(seen.at(-1)).toBeNull();
  });

  it("Enter selects the active stage: fires onSelect + pins an outline", async () => {
    const picks: unknown[] = [];
    const screen = await render(<Funnel data={PIPE} onSelect={(d) => picks.push(d)} />);
    const wrap = screen.container.querySelector(".mc-funnel-live") as HTMLElement;
    wrap.focus();
    key(wrap, "ArrowRight");
    key(wrap, "Enter");
    expect(picks.at(-1)).toEqual({ index: 0, value: 12400, label: "Visitors" });
    // Pin survives blur (it is selection, not hover).
    wrap.blur();
    await expect
      .poll(() => screen.container.querySelector('rect[data-mc-w="tick"]'))
      .not.toBeNull();
  });

  it("controlled selectedIndex pins the outline without focus", async () => {
    const screen = await render(<Funnel data={PIPE} selectedIndex={2} />);
    expect(screen.container.querySelector('rect[data-mc-w="tick"]')).not.toBeNull();
  });
});
