import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { Waterfall } from "./client.js";

const PL = [
  { label: "Product", value: 300 },
  { label: "Refunds", value: -140 },
];

const key = (el: HTMLElement, k: string) =>
  el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true }));

describe("interactive <Waterfall>", () => {
  it("←/→ rove steps with running levels; End focuses the total", async () => {
    const screen = await render(<Waterfall data={PL} start={1200} title="P&L" />);
    const wrap = screen.container.querySelector(".mc-waterfall-live") as HTMLElement;
    wrap.focus();
    // First arrow lands on step 0 (kernel contract), not step 1.
    key(wrap, "ArrowRight");
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toBe("Product: +300, running 1,500.");
    key(wrap, "ArrowRight");
    await expect.poll(() => live.textContent).toBe("Refunds: −140, running 1,360.");
    key(wrap, "End");
    await expect.poll(() => live.textContent).toBe("Total: 1,360.");
  });

  it("onActive reports the focused step (delta as value); null on Escape", async () => {
    const seen: unknown[] = [];
    const screen = await render(
      <Waterfall data={PL} start={1200} onActive={(d) => seen.push(d)} />,
    );
    const wrap = screen.container.querySelector(".mc-waterfall-live") as HTMLElement;
    wrap.focus();
    key(wrap, "ArrowRight");
    expect(seen[seen.length - 1]).toEqual({ index: 0, value: 300, label: "Product" });
    key(wrap, "ArrowRight");
    expect(seen[seen.length - 1]).toEqual({ index: 1, value: -140, label: "Refunds" });
    key(wrap, "Escape");
    expect(seen[seen.length - 1]).toBeNull();
  });

  it("Enter selects the active step: fires onSelect + pins a box that survives blur", async () => {
    const picks: unknown[] = [];
    const screen = await render(
      <Waterfall data={PL} start={1200} onSelect={(d) => picks.push(d)} />,
    );
    const wrap = screen.container.querySelector(".mc-waterfall-live") as HTMLElement;
    wrap.focus();
    key(wrap, "ArrowRight");
    key(wrap, "Enter");
    expect(picks[picks.length - 1]).toEqual({ index: 0, value: 300, label: "Product" });
    wrap.blur();
    await expect
      .poll(() => screen.container.querySelector('rect[data-mc-w="tick"]'))
      .not.toBeNull();
  });

  it("controlled selectedIndex pins the box without focus", async () => {
    const screen = await render(<Waterfall data={PL} start={1200} selectedIndex={1} />);
    expect(screen.container.querySelector('rect[data-mc-w="tick"]')).not.toBeNull();
  });
});
