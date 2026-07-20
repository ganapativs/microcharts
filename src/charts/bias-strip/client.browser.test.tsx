import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { BiasStrip } from "./client.js";

// three pairs at different means; the middle pair carries a +10 difference
const DATA = [
  { a: 11, b: 10 },
  { a: 30, b: 20 },
  { a: 22, b: 21 },
];

describe("interactive <BiasStrip>", () => {
  it("←/→ step pairs ordered by mean with mean/diff announcements + ring", async () => {
    const screen = await render(<BiasStrip data={DATA} title="Agreement" />);
    const wrap = screen.container.querySelector(".mc-bias-live") as HTMLElement;
    wrap.focus();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    const live = document.querySelector('[aria-live="polite"]')!;
    // leftmost mean is pair 1 (mean 10.5, diff +1)
    await expect.poll(() => live.textContent).toBe("Pair 1 of 3: mean 10.5, diff +1.");
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true }));
    // rightmost mean is pair 2 (mean 25, diff +10)
    await expect.poll(() => live.textContent).toBe("Pair 2 of 3: mean 25, diff +10.");
    expect(wrap.querySelectorAll("circle").length).toBe(4); // 3 dots + ring
  });

  it("hover finds the nearest pair by Euclidean distance", async () => {
    const screen = await render(<BiasStrip data={DATA} />);
    const wrap = screen.container.querySelector(".mc-bias-live") as HTMLElement;
    const r = wrap.getBoundingClientRect();
    wrap.dispatchEvent(
      new PointerEvent("pointermove", {
        bubbles: true,
        clientX: r.left + 2,
        clientY: r.top + r.height / 2, // leftmost mean, near the zero line
      }),
    );
    await expect
      .poll(() => document.querySelector(".mc-bias-readout, .mc-spark-readout")?.textContent)
      .toBe("10.5, +1");
  });

  it("onActive reports the focused pair (diff as value, mean as label); null after Escape", async () => {
    const seen: unknown[] = [];
    const screen = await render(<BiasStrip data={DATA} onActive={(d) => seen.push(d)} />);
    const wrap = screen.container.querySelector(".mc-bias-live") as HTMLElement;
    wrap.focus();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    expect(seen.at(-1)).toEqual({ index: 0, value: 1, label: "10.5" });
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true }));
    expect(seen.at(-1)).toEqual({ index: 1, value: 10, label: "25" });
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    expect(seen.at(-1)).toBeNull();
  });

  it("Enter selects the active pair: fires onSelect + pins a ring that survives blur", async () => {
    const picks: unknown[] = [];
    const screen = await render(<BiasStrip data={DATA} onSelect={(d) => picks.push(d)} />);
    const wrap = screen.container.querySelector(".mc-bias-live") as HTMLElement;
    wrap.focus();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    expect(picks.at(-1)).toEqual({ index: 0, value: 1, label: "10.5" });
    wrap.blur();
    await expect
      .poll(() => screen.container.querySelector('circle[data-mc-w="tick"]'))
      .not.toBeNull();
  });

  it("controlled selectedIndex pins the ring without focus", async () => {
    const screen = await render(<BiasStrip data={DATA} selectedIndex={2} />);
    expect(screen.container.querySelector('circle[data-mc-w="tick"]')).not.toBeNull();
  });
});
