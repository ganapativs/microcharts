import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { MiniBar } from "./client.js";

const DATA = [
  { label: "East", value: 940 },
  { label: "West", value: 410 },
  { label: "South", value: 620 },
  { label: "North", value: 120 },
];

const key = (el: HTMLElement, k: string) =>
  el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true }));

describe("interactive <MiniBar>", () => {
  it("arrow keys rove bars with rank announcements + focus ring", async () => {
    const screen = await render(<MiniBar data={DATA} title="Sales" />);
    const wrap = screen.container.querySelector(".mc-minibar-live") as HTMLElement;
    wrap.focus();
    // first Arrow from nothing focuses unit 0 (kernel contract), not unit 1
    key(wrap, "ArrowRight");
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toBe("East: 940 — 1st of 4.");
    expect(wrap.querySelectorAll("svg rect").length).toBe(5); // 4 bars + ring
    key(wrap, "ArrowRight");
    await expect.poll(() => live.textContent).toBe("West: 410 — 3rd of 4.");
    key(wrap, "End");
    await expect.poll(() => live.textContent).toBe("North: 120 — 4th of 4.");
  });

  it("hover finds the bar by band lookup and shows its value", async () => {
    const screen = await render(<MiniBar data={DATA} />);
    const wrap = screen.container.querySelector(".mc-minibar-live") as HTMLElement;
    const r = wrap.getBoundingClientRect();
    wrap.dispatchEvent(
      new PointerEvent("pointermove", {
        bubbles: true,
        clientX: r.left + 2, // first band
        clientY: r.top + r.height / 2,
      }),
    );
    await expect.poll(() => document.querySelector(".mc-spark-readout")?.textContent).toBe("940");
  });

  it("onActive reports the focused datum (index + value + label); null on clear", async () => {
    const seen: unknown[] = [];
    const screen = await render(<MiniBar data={DATA} onActive={(d) => seen.push(d)} />);
    const wrap = screen.container.querySelector(".mc-minibar-live") as HTMLElement;
    wrap.focus();
    key(wrap, "ArrowRight");
    expect(seen.at(-1)).toEqual({ index: 0, value: 940, label: "East" });
    key(wrap, "Escape");
    expect(seen.at(-1)).toBeNull();
  });

  it("Enter selects the active bar: fires onSelect + pins an outline that survives blur", async () => {
    const picks: unknown[] = [];
    const screen = await render(<MiniBar data={DATA} onSelect={(d) => picks.push(d)} />);
    const wrap = screen.container.querySelector(".mc-minibar-live") as HTMLElement;
    wrap.focus();
    key(wrap, "ArrowRight");
    key(wrap, "Enter");
    expect(picks.at(-1)).toEqual({ index: 0, value: 940, label: "East" });
    wrap.blur();
    await expect
      .poll(() => screen.container.querySelector('rect[data-mc-w="tick"]'))
      .not.toBeNull();
  });

  it("controlled selectedIndex pins the outline without focus", async () => {
    const screen = await render(<MiniBar data={DATA} selectedIndex={1} />);
    expect(screen.container.querySelector('rect[data-mc-w="tick"]')).not.toBeNull();
  });
});
