import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { IconArray } from "./client.js";

describe("interactive <IconArray>", () => {
  it("2-D roving announces the running count", async () => {
    const screen = await render(<IconArray value={0.15} total={20} title="Risk" />);
    const wrap = screen.container.querySelector(".mc-icon-array-live") as HTMLElement;
    wrap.focus();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true }));
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toBe("Unit 1 of 20 — filled. 3 of 20 filled.");
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
    await expect.poll(() => live.textContent).toBe("Unit 11 of 20 — empty. 3 of 20 filled.");
    expect(wrap.querySelectorAll("svg rect").length).toBe(21); // 20 units + ring
  });

  it("hover finds the nearest unit", async () => {
    const screen = await render(<IconArray value={0.5} total={20} />);
    const wrap = screen.container.querySelector(".mc-icon-array-live") as HTMLElement;
    const r = wrap.getBoundingClientRect();
    wrap.dispatchEvent(
      new PointerEvent("pointermove", {
        bubbles: true,
        clientX: r.left + 1,
        clientY: r.top + 1,
      }),
    );
    const live = document.querySelector('[aria-live="polite"]')!;
    // top-left corner → the first unit; running count is always stated
    await expect.poll(() => live.textContent).toBe("Unit 1 of 20 — filled. 10 of 20 filled.");
  });

  it("onActive reports the focused datum (unit index + filled state); null on clear", async () => {
    const seen: unknown[] = [];
    const screen = await render(
      <IconArray value={0.15} total={20} onActive={(d) => seen.push(d)} />,
    );
    const wrap = screen.container.querySelector(".mc-icon-array-live") as HTMLElement;
    wrap.focus();
    // k = 3, so unit 0 is filled → value 1.
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true }));
    await expect.poll(() => seen.at(-1)).toEqual({ index: 0, value: 1 });
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await expect.poll(() => seen.at(-1)).toBeNull();
  });

  it("Enter selects the active unit: fires onSelect + pins a ring that survives blur", async () => {
    const picks: unknown[] = [];
    const screen = await render(
      <IconArray value={0.15} total={20} onSelect={(d) => picks.push(d)} />,
    );
    const wrap = screen.container.querySelector(".mc-icon-array-live") as HTMLElement;
    wrap.focus();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true }));
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    await expect.poll(() => picks.at(-1)).toEqual({ index: 0, value: 1 });
    wrap.blur();
    await expect
      .poll(() => screen.container.querySelector('rect[data-mc-w="tick"]'))
      .not.toBeNull();
  });

  it("controlled selectedIndex pins the ring without focus", async () => {
    const screen = await render(<IconArray value={0.15} total={20} selectedIndex={1} />);
    expect(screen.container.querySelector('rect[data-mc-w="tick"]')).not.toBeNull();
  });
});
