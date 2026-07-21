import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { DualSparkline } from "./client.js";

const P = [12, 15, 17];
const C = [12, 14, 15];

const key = (el: HTMLElement, k: string) =>
  el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true }));

describe("interactive <DualSparkline>", () => {
  it("←/→ steps x announcing both series", async () => {
    const screen = await render(<DualSparkline data={P} compare={C} title="You vs plan" />);
    const wrap = screen.container.querySelector(".mc-dual-live") as HTMLElement;
    wrap.focus();
    key(wrap, "End");
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toBe("Point 3 of 3: 17 vs 15.");
  });

  it("onActive reports the focused datum (data index + primary value); null on clear", async () => {
    const seen: unknown[] = [];
    const screen = await render(
      <DualSparkline data={P} compare={C} onActive={(d) => seen.push(d)} />,
    );
    const wrap = screen.container.querySelector(".mc-dual-live") as HTMLElement;
    wrap.focus();
    key(wrap, "Home");
    key(wrap, "ArrowRight");
    expect(seen.at(-1)).toMatchObject({ index: 1, value: 15 });
    key(wrap, "Escape");
    expect(seen.at(-1)).toBeNull();
  });

  it("Enter selects the active x: fires onSelect + pins a persistent ring", async () => {
    const picks: unknown[] = [];
    const screen = await render(
      <DualSparkline data={P} compare={C} onSelect={(d) => picks.push(d)} />,
    );
    const wrap = screen.container.querySelector(".mc-dual-live") as HTMLElement;
    wrap.focus();
    key(wrap, "Home");
    key(wrap, "ArrowRight");
    key(wrap, "Enter");
    expect(picks.at(-1)).toMatchObject({ index: 1, value: 15 });
    // Pin survives blur (it is selection, not hover).
    wrap.blur();
    await expect
      .poll(() => screen.container.querySelector('circle[data-mc-w="tick"]'))
      .not.toBeNull();
  });

  it("controlled selectedIndex pins the ring without focus", async () => {
    const screen = await render(<DualSparkline data={P} compare={C} selectedIndex={2} />);
    expect(screen.container.querySelector('circle[data-mc-w="tick"]')).not.toBeNull();
  });
});
