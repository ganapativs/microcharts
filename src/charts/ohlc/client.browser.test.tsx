import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { Ohlc } from "./client.js";

const PERIODS = [
  { open: 145.1, high: 149.3, low: 144.0, close: 148.2 },
  { open: 148.2, high: 150.0, low: 147.1, close: 149.5 },
];

// The transient focus frame is the accent rect that is NOT a candle body
// (candle bodies also carry data-mc-w="support"); the pin is the "tick" rect.
const FOCUS = 'rect[data-mc-w="support"]:not([data-mc-ohlc])';
const PIN = 'rect[data-mc-w="tick"]';

describe("interactive <Ohlc>", () => {
  it("←/→ steps periods with full OHLC announcements", async () => {
    const screen = await render(<Ohlc data={PERIODS} title="AAPL" />);
    const wrap = screen.container.querySelector(".mc-ohlc-live") as HTMLElement;
    wrap.focus();
    // First arrow from nothing lands on period 1 (kernel-consistent).
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect
      .poll(() => live.textContent)
      .toBe("Period 1 of 2: open 145.1, high 149.3, low 144, close 148.2.");
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    await expect
      .poll(() => live.textContent)
      .toBe("Period 2 of 2: open 148.2, high 150, low 147.1, close 149.5.");
  });

  it("onActive reports the focused datum (period index + close); null on clear", async () => {
    const seen: unknown[] = [];
    const screen = await render(<Ohlc data={PERIODS} onActive={(d) => seen.push(d)} />);
    const fig = screen.container.querySelector(".mc-ohlc-live") as HTMLElement;
    fig.focus();
    await userEvent.keyboard("{Home}{ArrowRight}");
    expect(seen.at(-1)).toEqual({ index: 1, value: 149.5 });
    await userEvent.keyboard("{Escape}");
    expect(seen.at(-1)).toBeNull();
  });

  it("Enter selects the active period: fires onSelect + pins a persistent frame", async () => {
    const picks: unknown[] = [];
    const screen = await render(<Ohlc data={PERIODS} onSelect={(d) => picks.push(d)} />);
    const fig = screen.container.querySelector(".mc-ohlc-live") as HTMLElement;
    fig.focus();
    await userEvent.keyboard("{Home}{ArrowRight}{Enter}");
    expect(picks.at(-1)).toEqual({ index: 1, value: 149.5 });
    fig.blur();
    await expect.poll(() => fig.querySelector(PIN)).not.toBeNull();
    await expect.poll(() => fig.querySelector(FOCUS)).toBeNull();
  });

  it("controlled selectedIndex pins the frame with no interaction", async () => {
    const screen = await render(<Ohlc data={PERIODS} selectedIndex={0} />);
    const fig = screen.container.querySelector(".mc-ohlc-live") as HTMLElement;
    expect(fig.querySelector(PIN)).not.toBeNull();
  });
});
